"""
Environment validation at startup. Defaults/fallbacks are always allowed so the
app runs without a .env (e.g. in prod). In production with default SECRET_KEY
we only warn; set SECRET_KEY in the environment for real security.
"""
import logging

logger = logging.getLogger(__name__)

INSECURE_DEFAULT_SECRETS = (
    'django-insecure-dev-change-in-production',
    'django-insecure-dev-only-change-in-production',
)


def validate_env(debug: bool, secret_key: str) -> None:
    if debug:
        return
    # Production: allow defaults so app works without .env; warn if using default secret.
    if not secret_key or secret_key.strip() == '':
        logger.warning(
            'Production run with empty SECRET_KEY. Set SECRET_KEY in the environment '
            'for security. Using a placeholder so the app can start.'
        )
        return
    if secret_key.strip() in INSECURE_DEFAULT_SECRETS:
        logger.warning(
            'Production is using the default SECRET_KEY. Set SECRET_KEY in the environment '
            'or .env for security.'
        )
