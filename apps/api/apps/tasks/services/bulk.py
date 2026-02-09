"""Bulk task creation."""

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import QuerySet
from ..models import Task

User = get_user_model()


def bulk_create_tasks(user: User, rows: list[dict[str, Any]]) -> QuerySet[Task]:
    """
    Validate each row with model rules, then create tasks in one DB round-trip.
    Returns full objects ordered by created_at.
    Raises django.core.exceptions.ValidationError if any row fails model validation.
    """
    with transaction.atomic():
        tasks = []
        for row in rows:
            task = Task(user=user, **row)
            task.full_clean()
            tasks.append(task)
        created = Task.objects.bulk_create(tasks)
    ids = [t.pk for t in created]
    return Task.objects.filter(pk__in=ids).order_by('-created_at')
