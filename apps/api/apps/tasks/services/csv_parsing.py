"""CSV parsing for task bulk import."""

from typing import Any, BinaryIO

import pandas as pd

from ..constants import BULK_DESCRIPTION_MAX_LENGTH
from ..models import Task


def parse_csv_to_task_rows(csv_file: BinaryIO) -> list[dict[str, Any]]:
    """
    Parse CSV into a list of task row dicts (title, description, status).
    Rows with empty title are skipped. Raises on parse/encoding errors.
    """
    df = pd.read_csv(csv_file, encoding='utf-8', dtype=str)
    df = df.rename(columns=lambda c: c.strip().lower() if isinstance(c, str) else c)
    if 'title' not in df.columns:
        raise ValueError('CSV must contain a "title" column.')
    valid_statuses = {s.value for s in Task.Status}
    rows: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        title = str(row.get('title', '')).strip()
        if not title:
            continue
        desc = str(row.get('description', '')).strip()[:BULK_DESCRIPTION_MAX_LENGTH]
        raw_status = str(row.get('status', '')).strip().lower()
        status_val = raw_status if raw_status in valid_statuses else Task.Status.PENDING
        rows.append({
            'title': title[:255],
            'description': desc,
            'status': status_val,
        })
    return rows
