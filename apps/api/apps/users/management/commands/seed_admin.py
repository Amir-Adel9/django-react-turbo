import logging
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import OperationalError

User = get_user_model()
logger = logging.getLogger(__name__)

DEFAULT_ADMIN_EMAIL = "admin@example.com"
DEFAULT_ADMIN_NAME = "Admin"
DEV_SEED_PASSWORD = "admin123!"


def run_seed_admin():
    """
    Create default superuser if none exists. Safe to call at startup.
    Returns: "exists" | "created" | "skipped" (db not ready)
    """
    try:
        if User.objects.filter(email=DEFAULT_ADMIN_EMAIL).exists():
            logger.info("Admin user already exists, skipping seed.")
            return "exists"
    except OperationalError as e:
        logger.info("Database not ready for admin seed, skipping: %s", e)
        return "skipped"

    password = os.environ.get("ADMIN_SEED_PASSWORD", DEV_SEED_PASSWORD)
    if "ADMIN_SEED_PASSWORD" not in os.environ:
        logger.warning(
            "ADMIN_SEED_PASSWORD not set; using default. "
            "Set ADMIN_SEED_PASSWORD in production for a secure password."
        )

    User.objects.create_superuser(
        email=DEFAULT_ADMIN_EMAIL,
        name=DEFAULT_ADMIN_NAME,
        password=password,
    )
    logger.info("Seeded initial admin user: %s", DEFAULT_ADMIN_EMAIL)
    return "created"


class Command(BaseCommand):
    help = "Create a default superuser (admin@example.com) if none exists."

    def handle(self, *args, **options):
        result = run_seed_admin()
        if result == "exists":
            self.stdout.write("Admin user already exists, skipping seed.")
        elif result == "skipped":
            self.stdout.write(self.style.WARNING("Database not ready, skipping seed."))
        elif result == "created":
            self.stdout.write(self.style.SUCCESS(f"Seeding initial admin user: {DEFAULT_ADMIN_EMAIL}"))
