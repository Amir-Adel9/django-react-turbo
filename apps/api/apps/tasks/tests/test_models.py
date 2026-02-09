import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from tasks.models import Task

User = get_user_model()


class TestTaskModel:
    def test_create_task(self, user):
        """Test creating a task."""
        task = Task.objects.create(
            title='Test Task',
            description='Test description',
            status=Task.Status.PENDING,
            user=user
        )
        assert task.title == 'Test Task'
        assert task.description == 'Test description'
        assert task.status == Task.Status.PENDING
        assert task.user == user
        assert task.created_at is not None

    def test_task_default_status(self, user):
        """Test task default status is PENDING."""
        task = Task.objects.create(
            title='Test Task',
            user=user
        )
        assert task.status == Task.Status.PENDING

    def test_task_str(self, user):
        """Test task string representation."""
        task = Task.objects.create(
            title='Test Task',
            user=user
        )
        assert str(task) == 'Test Task'

    def test_task_ordering(self, user):
        """Test tasks are ordered by created_at descending."""
        import time
        task1 = Task.objects.create(title='First Task', user=user)
        time.sleep(0.01)  # Small delay to ensure different timestamp
        task2 = Task.objects.create(title='Second Task', user=user)
        tasks = list(Task.objects.filter(user=user))
        assert tasks[0] == task2  # Most recent first
        assert tasks[1] == task1

    def test_task_user_relationship(self, user):
        """Test task belongs to user."""
        task = Task.objects.create(title='Test Task', user=user)
        assert task.user == user
        assert task in user.tasks.all()

    def test_task_status_choices(self, user):
        """Test task status choices."""
        task = Task.objects.create(
            title='Test Task',
            user=user,
            status=Task.Status.IN_PROGRESS
        )
        assert task.status == Task.Status.IN_PROGRESS
        
        task.status = Task.Status.COMPLETED
        task.save()
        assert task.status == Task.Status.COMPLETED

    def test_task_cascade_delete(self, user):
        """Test that deleting user deletes their tasks."""
        task = Task.objects.create(title='Test Task', user=user)
        task_id = task.id
        user.delete()
        assert not Task.objects.filter(id=task_id).exists()
