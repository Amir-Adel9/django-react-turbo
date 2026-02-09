from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from users.management.commands.seed_admin import run_seed_admin
        run_seed_admin()
