from django.conf import settings
from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='task_user_created_idx'),
            models.Index(fields=['user', 'status'], name='task_user_status_idx'),
        ]

    def __str__(self):
        return self.title
