from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # Seed admin user automatically on startup
        # The run_seed_admin function handles errors gracefully (skips if DB not ready)
        try:
            from users.management.commands.seed_admin import run_seed_admin
            run_seed_admin()
        except Exception:
            # Silently fail if imports or execution fails (e.g., during migrations)
            pass
