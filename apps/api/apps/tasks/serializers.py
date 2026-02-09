from rest_framework import serializers
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer

from .constants import BULK_DESCRIPTION_MAX_LENGTH
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ("id", "title", "description", "status")
        read_only_fields = ("id",)


class TaskStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField(read_only=True)
    completed = serializers.IntegerField(read_only=True)
    in_progress = serializers.IntegerField(read_only=True)
    pending = serializers.IntegerField(read_only=True)


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Bulk tasks (JSON array)',
            value=[
                {'title': 'First task', 'status': 'pending'},
                {'title': 'Second task', 'description': 'Optional description', 'status': 'in_progress'},
            ],
            request_only=True,
        ),
    ],
)
class TaskBulkItemSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        max_length=BULK_DESCRIPTION_MAX_LENGTH,
    )
    status = serializers.ChoiceField(
        choices=Task.Status.choices,
        required=False,
        default=Task.Status.PENDING,
    )
