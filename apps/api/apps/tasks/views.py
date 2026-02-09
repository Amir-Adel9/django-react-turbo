"""Task API: CRUD, stats, bulk create (JSON/CSV), and Excel export."""

from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .filters import TaskFilter
from .models import Task
from .pagination import TaskPagination
from .serializers import TaskCreateSerializer, TaskSerializer
from .view_mixins import TaskBulkCreateMixin, TaskExportMixin, TaskStatsMixin


class TaskViewSet(
    TaskStatsMixin,
    TaskBulkCreateMixin,
    TaskExportMixin,
    viewsets.ModelViewSet,
):
    """
    ViewSet for task CRUD, filtered by the current user.
    Supports list/create/retrieve/update/destroy, stats, bulk create (JSON or CSV), and Excel export.
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
