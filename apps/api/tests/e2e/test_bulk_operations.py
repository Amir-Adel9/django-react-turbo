"""
E2E tests for bulk operations: bulk create (JSON/CSV) and export
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from tasks.models import Task

User = get_user_model()


@pytest.mark.django_db
class TestBulkOperations:
    def test_bulk_create_json(self, authenticated_client, user):
        """Test bulk creating tasks via JSON."""
        bulk_url = reverse('task-bulk', urlconf='config.urls')
        bulk_data = [
            {'title': 'Bulk Task 1', 'status': 'pending'},
            {'title': 'Bulk Task 2', 'description': 'Description', 'status': 'in_progress'},
            {'title': 'Bulk Task 3'}
        ]
        response = authenticated_client.post(bulk_url, bulk_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 3
        assert Task.objects.filter(user=user).count() == 3
        assert Task.objects.filter(user=user, title='Bulk Task 1').exists()
        assert Task.objects.filter(user=user, title='Bulk Task 2').exists()
        assert Task.objects.filter(user=user, title='Bulk Task 3').exists()

    def test_bulk_create_csv(self, authenticated_client, user):
        """Test bulk creating tasks via CSV."""
        import io
        bulk_url = reverse('task-bulk', urlconf='config.urls')
        csv_content = "title,description,status\nCSV Task 1,Desc 1,pending\nCSV Task 2,,in_progress\nCSV Task 3"
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        
        response = authenticated_client.post(
            bulk_url,
            {'file': csv_file},
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 3
        assert Task.objects.filter(user=user).count() == 3

    def test_export_tasks(self, authenticated_client, user):
        """Test exporting tasks to Excel."""
        # Create some tasks
        Task.objects.create(title='Export Task 1', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='Export Task 2', status=Task.Status.COMPLETED, user=user)
        Task.objects.create(title='Export Task 3', status=Task.Status.IN_PROGRESS, user=user)
        
        export_url = reverse('task-export', urlconf='config.urls')
        response = authenticated_client.get(export_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        assert 'Content-Disposition' in response
        assert 'attachment' in response['Content-Disposition']
        assert response.content.startswith(b'PK')  # Excel files start with ZIP signature

    def test_export_with_filters(self, authenticated_client, user):
        """Test exporting tasks with filters."""
        Task.objects.create(title='Pending Task', status=Task.Status.PENDING, user=user)
        Task.objects.create(title='Completed Task', status=Task.Status.COMPLETED, user=user)
        
        export_url = reverse('task-export', urlconf='config.urls')
        response = authenticated_client.get(export_url, {'status': Task.Status.PENDING})
        
        assert response.status_code == status.HTTP_200_OK
        # Should only export pending tasks
