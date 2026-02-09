import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """API client for making requests."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email='test@example.com',
        name='Test User',
        password='testpass123!'
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """API client authenticated with a user."""
    from django.conf import settings
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    # Set cookies with proper names from settings
    api_client.cookies[settings.SIMPLE_JWT['AUTH_COOKIE']] = access_token
    api_client.cookies[settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']] = refresh_token
    # Force authentication for DRF
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def superuser(db):
    """Create a test superuser."""
    return User.objects.create_superuser(
        email='admin@example.com',
        name='Admin User',
        password='adminpass123!'
    )
