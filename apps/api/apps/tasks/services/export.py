"""Task export to Excel: filtering and workbook building."""

import io
from datetime import datetime
from typing import Any, Mapping

from django.db.models import QuerySet
from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from rest_framework import status
from rest_framework.response import Response

from ..constants import EXPORT_MAX_ROWS
from ..models import Task

# Characters that trigger formula interpretation in Excel (OWASP / CWE-1236).
_EXCEL_FORMULA_PREFIXES = ('=', '+', '-', '@')


def _safe_excel_cell(value: str) -> str:
    """Escape leading formula characters to prevent formula injection."""
    if not value:
        return value
    stripped = value.strip()
    if stripped.startswith(_EXCEL_FORMULA_PREFIXES):
        return "'" + value
    return value


def parse_iso_datetime(value: str) -> datetime:
    """Parse ISO 8601 string; make naive datetimes timezone-aware."""
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def apply_export_filters(
    qs: QuerySet[Task],
    query_params: Mapping[str, Any],
) -> tuple[QuerySet[Task] | None, Response | None]:
    """
    Apply from/to/status from query_params to qs.
    Returns (qs, None) on success, or (None, error_response) on invalid params or over limit.
    Query param values are stripped of leading/trailing whitespace.
    """
    from_param = (query_params.get('from') or '').strip()
    to_param = (query_params.get('to') or '').strip()
    status_param = (query_params.get('status') or '').strip()

    if from_param:
        try:
            from_dt = parse_iso_datetime(from_param)
            qs = qs.filter(created_at__gte=from_dt)
        except ValueError:
            return None, Response(
                {'detail': f'Invalid date for "from": {from_param!r}. Use ISO 8601 (e.g. 2025-01-01).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    if to_param:
        try:
            to_dt = parse_iso_datetime(to_param)
            qs = qs.filter(created_at__lte=to_dt)
        except ValueError:
            return None, Response(
                {'detail': f'Invalid date for "to": {to_param!r}. Use ISO 8601 (e.g. 2025-01-01).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    if status_param and status_param in {s.value for s in Task.Status}:
        qs = qs.filter(status=status_param)

    row_count = qs.count()
    if row_count > EXPORT_MAX_ROWS:
        return None, Response(
            {
                'detail': f'Too many tasks to export ({row_count}). Maximum {EXPORT_MAX_ROWS} rows. '
                'Use from/to or status to narrow the range.',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return qs, None


def build_excel_response(qs: QuerySet[Task]) -> HttpResponse:
    """Build an .xlsx HttpResponse from a task queryset (ordered by -created_at)."""
    wb = Workbook()
    ws = wb.active
    ws.title = 'Tasks'
    ws.append(['Title', 'Description', 'Status', 'Created At'])
    for task in qs.order_by('-created_at'):
        ws.append([
            _safe_excel_cell(task.title),
            _safe_excel_cell(task.description or ''),
            task.get_status_display(),
            task.created_at.isoformat() if task.created_at else '',
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Cache-Control'] = 'private, no-store'
    export_date = timezone.now().strftime('%Y-%m-%d')
    response['Content-Disposition'] = f'attachment; filename="tasks_export_{export_date}.xlsx"'
    return response
