from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ("title", "description", "status")


class TaskStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField(read_only=True)
    completed = serializers.IntegerField(read_only=True)
    pending = serializers.IntegerField(read_only=True)
