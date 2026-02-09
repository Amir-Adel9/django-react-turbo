"""
E2E tests for task statistics endpoint
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from tasks.models import Task

User = get_user_model()


@pytest.mark.django_db
class TestTaskStats:
    def test_stats_endpoint(self, authenticated_client, user):
        """Test getting task statistics."""
        # Create tasks with different statuses
        Task.objects.create(title='Pending 1', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='Pending 2', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='In Progress', status=Task.Status.IN_PROGRESS, user=user)
        Task.objects.create(title='Completed 1', status=Task.Status.COMPLETED, user=user)
        Task.objects.create(title='Completed 2', status=Task.Status.COMPLETED, user=user)
        Task.objects.create(title='Completed 3', status=Task.Status.COMPLETED, user=user)
        
        stats_url = reverse('task-stats', urlconf='config.urls')
        response = authenticated_client.get(stats_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 6
        assert response.data['pending'] == 2
        assert response.data['in_progress'] == 1
        assert response.data['completed'] == 3

    def test_stats_empty(self, authenticated_client, user):
        """Test stats with no tasks."""
        stats_url = reverse('task-stats', urlconf='config.urls')
        response = authenticated_client.get(stats_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 0
        assert response.data['pending'] == 0
        assert response.data['in_progress'] == 0
        assert response.data['completed'] == 0

    def test_stats_user_isolation(self, authenticated_client, user):
        """Test that stats only count current user's tasks."""
        # Create tasks for current user
        Task.objects.create(title='User 1 Task', status=Task.Status.PENDING, user=user)
        
        # Create tasks for another user
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123!'
        )
        Task.objects.create(title='User 2 Task', status=Task.Status.PENDING, user=other_user)
        Task.objects.create(title='User 2 Task 2', status=Task.Status.COMPLETED, user=other_user)
        
        stats_url = reverse('task-stats', urlconf='config.urls')
        response = authenticated_client.get(stats_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 1
        assert response.data['pending'] == 1
        assert response.data['completed'] == 0
