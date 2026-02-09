import pytest
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

from tasks.models import Task
from tasks.serializers import TaskSerializer, TaskCreateSerializer, TaskBulkItemSerializer

User = get_user_model()


class TestTaskSerializer:
    def test_serialize_task(self, user):
        """Test serializing a task."""
        task = Task.objects.create(
            title='Test Task',
            description='Test description',
            status=Task.Status.PENDING,
            user=user
        )
        serializer = TaskSerializer(task)
        data = serializer.data
        assert data['id'] == task.id
        assert data['title'] == 'Test Task'
        assert data['description'] == 'Test description'
        assert data['status'] == Task.Status.PENDING
        assert 'created_at' in data

    def test_task_serializer_read_only_fields(self, user):
        """Test that id and created_at are read-only."""
        task = Task.objects.create(title='Test Task', user=user)
        serializer = TaskSerializer(task, data={'id': 999, 'title': 'Updated'})
        # Read-only fields should be ignored
        assert serializer.is_valid()
        assert serializer.validated_data['title'] == 'Updated'
        assert 'id' not in serializer.validated_data


class TestTaskCreateSerializer:
    def test_create_task_valid(self, db):
        """Test creating a task with valid data."""
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'status': Task.Status.IN_PROGRESS
        }
        serializer = TaskCreateSerializer(data=data)
        assert serializer.is_valid()
        validated_data = serializer.validated_data
        assert validated_data['title'] == 'New Task'
        assert validated_data['description'] == 'Task description'
        assert validated_data['status'] == Task.Status.IN_PROGRESS

    def test_create_task_minimal(self, db):
        """Test creating a task with minimal required fields."""
        data = {
            'title': 'New Task'
        }
        serializer = TaskCreateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['title'] == 'New Task'
        # Description is optional, so None if not provided (not empty string)
        assert serializer.validated_data.get('description') is None or serializer.validated_data.get('description') == ''
        # Status is optional in serializer, defaults to None if not provided
        # The model will use its default (PENDING) when creating the instance
        assert serializer.validated_data.get('status') is None or serializer.validated_data.get('status') == Task.Status.PENDING

    def test_create_task_empty_title(self, db):
        """Test that empty title is invalid."""
        data = {
            'title': ''
        }
        serializer = TaskCreateSerializer(data=data)
        assert not serializer.is_valid()


class TestTaskBulkItemSerializer:
    def test_bulk_item_valid(self, db):
        """Test valid bulk item."""
        data = {
            'title': 'Bulk Task',
            'description': 'Description',
            'status': Task.Status.PENDING
        }
        serializer = TaskBulkItemSerializer(data=data)
        assert serializer.is_valid()

    def test_bulk_item_minimal(self, db):
        """Test bulk item with only title."""
        data = {
            'title': 'Bulk Task'
        }
        serializer = TaskBulkItemSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['title'] == 'Bulk Task'
        assert serializer.validated_data.get('description') == ''
        assert serializer.validated_data.get('status') == Task.Status.PENDING

    def test_bulk_item_empty_title(self, db):
        """Test bulk item requires title."""
        data = {
            'description': 'No title'
        }
        serializer = TaskBulkItemSerializer(data=data)
        assert not serializer.is_valid()

    def test_bulk_item_invalid_status(self, db):
        """Test bulk item with invalid status."""
        data = {
            'title': 'Task',
            'status': 'invalid_status'
        }
        serializer = TaskBulkItemSerializer(data=data)
        assert not serializer.is_valid()
