"""ViewSet mixins for task custom actions: stats, bulk create, export."""

import io

import pandas as pd
from django.core.exceptions import ValidationError
from django.db.models import Count, Q, QuerySet
from django.http import HttpResponse
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .constants import BULK_MAX_SIZE, EXPORT_MAX_ROWS, MAX_CSV_BODY_BYTES
from .models import Task
from .serializers import TaskBulkItemSerializer, TaskSerializer, TaskStatsSerializer
from .services import (
    apply_export_filters,
    build_excel_response,
    bulk_create_tasks,
    parse_csv_to_task_rows,
)


class TaskStatsMixin:
    """Mixin adding a GET stats action (task counts by status)."""

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


class TaskBulkCreateMixin:
    """Mixin adding a POST bulk action (JSON array or CSV file)."""

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
            if len(request.body) > MAX_CSV_BODY_BYTES:
                return Response(
                    {'detail': f'CSV body too large. Maximum {MAX_CSV_BODY_BYTES // (1024 * 1024)} MB.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            csv_file = io.BytesIO(request.body)

        if csv_file:
            try:
                rows_to_create = parse_csv_to_task_rows(csv_file)
            except UnicodeDecodeError:
                return Response(
                    {'detail': 'CSV must be UTF-8 encoded.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except (pd.errors.ParserError, pd.errors.EmptyDataError, ValueError) as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
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
            try:
                created = bulk_create_tasks(user, rows_to_create)
            except ValidationError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if not isinstance(request.data, list):
                return Response(
                    {'detail': 'Request body must be a JSON array of task objects.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not request.data:
                return Response(
                    {'detail': 'At least one task is required.'},
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
            rows_to_create = [
                {
                    'title': item['title'],
                    'description': item.get('description', ''),
                    'status': item.get('status', Task.Status.PENDING),
                }
                for item in data
            ]
            try:
                created = bulk_create_tasks(user, rows_to_create)
            except ValidationError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            TaskSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class TaskExportMixin:
    """Mixin adding a GET export action (Excel .xlsx with optional from/to/status filters)."""

    @extend_schema(
        description=(
            'Export tasks as Excel (.xlsx). Optional query params: from, to (ISO 8601 dates, '
            'interpreted in server timezone if naive), status. Returns file with headers only when '
            f'no tasks match. Maximum {EXPORT_MAX_ROWS} rows; request fails with 400 if exceeded.'
        ),
        parameters=[
            OpenApiParameter(
                'from',
                type=str,
                description='Filter tasks created on or after this date (ISO 8601, e.g. 2025-01-01 or 2025-01-01T00:00:00Z).',
                required=False,
            ),
            OpenApiParameter(
                'to',
                type=str,
                description='Filter tasks created on or before this date (ISO 8601).',
                required=False,
            ),
            OpenApiParameter(
                'status',
                type=str,
                description='Filter by status: pending, in_progress, completed.',
                required=False,
                enum=[s.value for s in Task.Status],
            ),
        ],
        responses={
            200: {'content': {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {}}},
            400: {'description': 'Invalid date parameter or export row limit exceeded.'},
        },
    )
    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request: Request) -> Response | HttpResponse:
        qs = self.get_queryset()
        filtered_qs, error_response = apply_export_filters(qs, request.query_params)
        if error_response is not None:
            return error_response
        if filtered_qs is None:
            return Response(
                {'detail': 'Export filter error.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return build_excel_response(filtered_qs)
