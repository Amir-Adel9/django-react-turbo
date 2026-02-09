"""Task API: CRUD, stats, and bulk create (JSON/CSV)."""

import io
from typing import Any

import pandas as pd
from django.db import transaction
from django.db.models import Count, Q, QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .constants import BULK_DESCRIPTION_MAX_LENGTH, BULK_MAX_SIZE
from .filters import TaskFilter
from .models import Task
from .pagination import TaskPagination
from .serializers import (
    TaskBulkItemSerializer,
    TaskCreateSerializer,
    TaskSerializer,
    TaskStatsSerializer,
)


def _parse_csv_to_task_rows(csv_file: io.BytesIO | Any) -> list[dict[str, Any]]:
    """
    Parse CSV into a list of task row dicts (title, description, status).
    Rows with empty title are skipped. Raises on parse/encoding errors.
    """
    df = pd.read_csv(csv_file, encoding='utf-8', dtype=str)
    df = df.rename(columns=lambda c: c.strip().lower() if isinstance(c, str) else c)
    if 'title' not in df.columns:
        raise ValueError('CSV must contain a "title" column.')
    valid_statuses = {s.value for s in Task.Status}
    rows: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        title = str(row.get('title', '')).strip()
        if not title:
            continue
        desc = str(row.get('description', '')).strip()[:BULK_DESCRIPTION_MAX_LENGTH]
        raw_status = str(row.get('status', '')).strip().lower()
        status_val = raw_status if raw_status in valid_statuses else Task.Status.PENDING
        rows.append({
            'title': title[:255],
            'description': desc,
            'status': status_val,
        })
    return rows


def _bulk_create_tasks(user: Any, rows: list[dict[str, Any]]) -> QuerySet[Task]:
    """Create tasks in one DB round-trip; returns full objects ordered by created_at."""
    with transaction.atomic():
        tasks = [Task(user=user, **row) for row in rows]
        created = Task.objects.bulk_create(tasks)
    ids = [t.pk for t in created]
    return Task.objects.filter(pk__in=ids).order_by('-created_at')


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for task CRUD, filtered by the current user.
    Supports list/create/retrieve/update/destroy, stats, and bulk create (JSON or CSV).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TaskFilter
    pagination_class = TaskPagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self) -> QuerySet[Task]:
        return Task.objects.filter(user=self.request.user)

    def get_serializer_class(self) -> type:
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def perform_create(self, serializer: TaskCreateSerializer) -> None:
        serializer.save(user=self.request.user)

    @extend_schema(
        responses=TaskStatsSerializer,
        description='Task counts for the current user (total, completed, in_progress, pending).',
    )
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request: Request) -> Response:
        qs = self.get_queryset()
        agg = qs.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status=Task.Status.COMPLETED)),
            in_progress=Count('id', filter=Q(status=Task.Status.IN_PROGRESS)),
            pending=Count('id', filter=Q(status=Task.Status.PENDING)),
        )
        return Response(agg)

    @extend_schema(
        request=TaskBulkItemSerializer(many=True),
        responses={201: TaskSerializer(many=True)},
        description=(
            'Create multiple tasks. Send a JSON array of task objects, or CSV via '
            'multipart file (key "file" or "csv") or raw body with Content-Type: text/csv. '
            f'Maximum {BULK_MAX_SIZE} items per request. At least one task required. '
            'Requires authentication (cookie).'
        ),
    )
    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk(self, request: Request) -> Response:
        user = request.user
        created: QuerySet[Task]

        csv_file = request.FILES.get('file') or request.FILES.get('csv')
        if not csv_file and request.content_type and 'text/csv' in (request.content_type or '') and request.body:
            csv_file = io.BytesIO(request.body)

        if csv_file:
            try:
                rows_to_create = _parse_csv_to_task_rows(csv_file)
            except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError, ValueError) as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if len(rows_to_create) > BULK_MAX_SIZE:
                return Response(
                    {'detail': f'Too many rows. Maximum {BULK_MAX_SIZE} tasks per request.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not rows_to_create:
                return Response(
                    {'detail': 'At least one task with a non-empty title is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            created = _bulk_create_tasks(user, rows_to_create)
        else:
            if not isinstance(request.data, list):
                return Response(
                    {'detail': 'Request body must be a JSON array of task objects.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer = TaskBulkItemSerializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            if len(data) > BULK_MAX_SIZE:
                return Response(
                    {'detail': f'Too many items. Maximum {BULK_MAX_SIZE} tasks per request.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not data:
                return Response(
                    {'detail': 'At least one task is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            rows_to_create = [
                {
                    'title': item['title'],
                    'description': item.get('description', ''),
                    'status': item.get('status', Task.Status.PENDING),
                }
                for item in data
            ]
            created = _bulk_create_tasks(user, rows_to_create)

        return Response(
            TaskSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )
