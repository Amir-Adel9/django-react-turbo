import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from tasks.models import Task
from tasks.filters import TaskFilter

User = get_user_model()


class TestTaskFilter:
    def test_filter_by_status(self, user):
        """Test filtering tasks by status."""
        Task.objects.create(title='Pending Task', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='In Progress Task', status=Task.Status.IN_PROGRESS, user=user)
        Task.objects.create(title='Completed Task', status=Task.Status.COMPLETED, user=user)
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'status': Task.Status.PENDING}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert filtered.first().status == Task.Status.PENDING

    def test_filter_by_search_title(self, user):
        """Test searching tasks by title."""
        Task.objects.create(title='Python Task', user=user)
        Task.objects.create(title='JavaScript Task', user=user)
        Task.objects.create(title='React Task', user=user)
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'search': 'Python'}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert 'Python' in filtered.first().title

    def test_filter_by_search_description(self, user):
        """Test searching tasks by description."""
        Task.objects.create(title='Task 1', description='Python description', user=user)
        Task.objects.create(title='Task 2', description='JavaScript description', user=user)
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'search': 'Python'}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert 'Python' in filtered.first().description

    def test_filter_by_created_after(self, user):
        """Test filtering tasks created after a date."""
        now = timezone.now()
        old_task = Task.objects.create(title='Old Task', user=user)
        old_task.created_at = now - timedelta(days=10)
        old_task.save()
        
        new_task = Task.objects.create(title='New Task', user=user)
        new_task.created_at = now - timedelta(days=1)
        new_task.save()
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'created_after': now - timedelta(days=5)}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert filtered.first().title == 'New Task'

    def test_filter_by_created_before(self, user):
        """Test filtering tasks created before a date."""
        now = timezone.now()
        old_task = Task.objects.create(title='Old Task', user=user)
        old_task.created_at = now - timedelta(days=10)
        old_task.save()
        
        new_task = Task.objects.create(title='New Task', user=user)
        new_task.created_at = now - timedelta(days=1)
        new_task.save()
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'created_before': now - timedelta(days=5)}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert filtered.first().title == 'Old Task'

    def test_filter_empty_search(self, user):
        """Test that empty search returns all tasks."""
        Task.objects.create(title='Task 1', user=user)
        Task.objects.create(title='Task 2', user=user)
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({'search': ''}, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 2

    def test_filter_multiple_criteria(self, user):
        """Test filtering with multiple criteria."""
        Task.objects.create(title='Python Task', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='Python Task 2', status=Task.Status.COMPLETED, user=user)
        Task.objects.create(title='JavaScript Task', status=Task.Status.PENDING, user=user)
        
        queryset = Task.objects.filter(user=user)
        filter_instance = TaskFilter({
            'search': 'Python',
            'status': Task.Status.PENDING
        }, queryset=queryset)
        filtered = filter_instance.qs
        
        assert filtered.count() == 1
        assert filtered.first().title == 'Python Task'
