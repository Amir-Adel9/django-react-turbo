# Build and run Django API with gunicorn
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies (no dev group)
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --no-install-project

# Copy application
COPY . .

# Run migrations and start gunicorn
RUN uv run python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD uv run python manage.py migrate --noinput && \
    uv run gunicorn config.wsgi:application --bind 0.0.0.0:8000
