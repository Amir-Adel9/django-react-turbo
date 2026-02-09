"""
E2E tests for tasks flow: create → list → update → delete
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from tasks.models import Task

User = get_user_model()


@pytest.mark.django_db
class TestTasksFlow:
    def test_complete_tasks_crud_flow(self, authenticated_client, user):
        """Test complete CRUD flow for tasks."""
        # 1. Create task
        create_url = reverse('task-list', urlconf='config.urls')
        create_data = {
            'title': 'E2E Task',
            'description': 'E2E Description',
            'status': Task.Status.PENDING
        }
        create_response = authenticated_client.post(create_url, create_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        task_id = create_response.data['id']
        assert create_response.data['title'] == 'E2E Task'
        assert Task.objects.filter(id=task_id, user=user).exists()

        # 2. List tasks
        list_response = authenticated_client.get(create_url)
        assert list_response.status_code == status.HTTP_200_OK
        assert len(list_response.data['results']) >= 1
        assert any(task['id'] == task_id for task in list_response.data['results'])

        # 3. Retrieve task
        detail_url = reverse('task-detail', kwargs={'pk': task_id}, urlconf='config.urls')
        retrieve_response = authenticated_client.get(detail_url)
        assert retrieve_response.status_code == status.HTTP_200_OK
        assert retrieve_response.data['title'] == 'E2E Task'

        # 4. Update task
        update_data = {
            'title': 'Updated E2E Task',
            'status': Task.Status.IN_PROGRESS
        }
        update_response = authenticated_client.patch(detail_url, update_data, format='json')
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['title'] == 'Updated E2E Task'
        assert update_response.data['status'] == Task.Status.IN_PROGRESS

        # 5. Delete task
        delete_response = authenticated_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not Task.objects.filter(id=task_id).exists()

    def test_task_isolation_between_users(self, authenticated_client, user):
        """Test that users can only see their own tasks."""
        # Create task for current user
        task1 = Task.objects.create(title='User 1 Task', user=user)
        
        # Create another user and their task
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123!'
        )
        task2 = Task.objects.create(title='User 2 Task', user=other_user)
        
        # List tasks - should only see own task
        list_url = reverse('task-list')
        response = authenticated_client.get(list_url)
        assert response.status_code == status.HTTP_200_OK
        task_ids = [task['id'] for task in response.data['results']]
        assert task1.id in task_ids
        assert task2.id not in task_ids
        
        # Try to access other user's task - should fail
        detail_url = reverse('task-detail', kwargs={'pk': task2.id})
        response = authenticated_client.get(detail_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
