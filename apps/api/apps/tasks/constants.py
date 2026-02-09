"""App-wide constants for the tasks API."""

BULK_MAX_SIZE = 500
BULK_DESCRIPTION_MAX_LENGTH = 10_000
EXPORT_MAX_ROWS = 10_000
MAX_CSV_BODY_BYTES = 5 * 1024 * 1024  # 5 MB for raw CSV request body
