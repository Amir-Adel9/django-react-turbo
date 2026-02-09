from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # Seed admin is handled via management command in Docker CMD
        # Don't run during app initialization to avoid errors before migrations
        pass
