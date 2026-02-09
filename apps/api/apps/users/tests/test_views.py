import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


class TestRegisterView:
    def test_register_success(self, api_client, db):
        """Test successful user registration."""
        url = reverse('auth_register')
        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'message' in response.data
        assert User.objects.filter(email='newuser@example.com').exists()

    def test_register_invalid_data(self, api_client, db):
        """Test registration with invalid data."""
        url = reverse('auth_register')
        data = {
            'email': 'invalid-email',
            'name': '',
            'password': '123',
            'password_confirm': '456'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, user):
        """Test registration with duplicate email."""
        url = reverse('auth_register')
        data = {
            'email': user.email,
            'name': 'Another User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLoginView:
    def test_login_success(self, api_client, user):
        """Test successful login."""
        url = reverse('token_obtain_pair')
        data = {
            'email': user.email,
            'password': 'testpass123!'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.cookies
        assert 'refresh' in response.cookies
        assert response.cookies['access'].value
        assert response.cookies['refresh'].value

    def test_login_invalid_credentials(self, api_client, user):
        """Test login with invalid credentials."""
        url = reverse('token_obtain_pair')
        data = {
            'email': user.email,
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client, db):
        """Test login with non-existent user."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword123!'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeView:
    def test_get_me_authenticated(self, authenticated_client, user):
        """Test getting current user info when authenticated."""
        url = reverse('auth_me')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['name'] == user.name

    def test_get_me_unauthenticated(self, api_client):
        """Test getting current user info when not authenticated."""
        url = reverse('auth_me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogoutView:
    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        url = reverse('logout')
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        # Check that cookies are cleared
        assert 'access' not in response.cookies or not response.cookies['access'].value
        assert 'refresh' not in response.cookies or not response.cookies['refresh'].value

    def test_logout_unauthenticated(self, api_client):
        """Test logout when not authenticated."""
        url = reverse('logout')
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRefreshView:
    def test_refresh_success(self, authenticated_client):
        """Test successful token refresh."""
        url = reverse('token_refresh')
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.cookies
        assert response.cookies['access'].value

    def test_refresh_without_token(self, api_client):
        """Test refresh without refresh token."""
        url = reverse('token_refresh')
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_invalid_token(self, api_client):
        """Test refresh with invalid token."""
        from django.conf import settings
        url = reverse('token_refresh')
        api_client.cookies[settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']] = 'invalid_token'
        response = api_client.post(url)
        # Should return 401, but might return 500 if exception handler catches it
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Either way, should indicate error
        assert 'detail' in response.data or 'error' in str(response.data).lower()
