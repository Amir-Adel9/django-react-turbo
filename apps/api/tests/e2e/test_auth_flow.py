"""
E2E tests for authentication flow: register → login → refresh → logout
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestAuthFlow:
    def test_complete_auth_flow(self, api_client):
        """Test complete authentication flow."""
        # 1. Register
        register_url = reverse('auth_register')
        register_data = {
            'email': 'e2e@example.com',
            'name': 'E2E User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        register_response = api_client.post(register_url, register_data, format='json')
        assert register_response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='e2e@example.com').exists()

        # 2. Login
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'e2e@example.com',
            'password': 'SecurePass123!'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.cookies
        assert 'refresh' in login_response.cookies
        
        # Store cookies for subsequent requests
        api_client.cookies['access'] = login_response.cookies['access'].value
        api_client.cookies['refresh'] = login_response.cookies['refresh'].value

        # 3. Get current user (me)
        me_url = reverse('auth_me')
        me_response = api_client.get(me_url)
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.data['email'] == 'e2e@example.com'
        assert me_response.data['name'] == 'E2E User'

        # 4. Refresh token
        refresh_url = reverse('token_refresh')
        refresh_response = api_client.post(refresh_url)
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.cookies
        
        # Update access token
        api_client.cookies['access'] = refresh_response.cookies['access'].value
        if 'refresh' in refresh_response.cookies:
            api_client.cookies['refresh'] = refresh_response.cookies['refresh'].value

        # 5. Verify still authenticated after refresh
        me_response_after_refresh = api_client.get(me_url)
        assert me_response_after_refresh.status_code == status.HTTP_200_OK

        # 6. Logout
        logout_url = reverse('logout')
        logout_response = api_client.post(logout_url)
        assert logout_response.status_code == status.HTTP_200_OK
        
        # 7. Verify cannot access protected endpoint after logout
        me_response_after_logout = api_client.get(me_url)
        assert me_response_after_logout.status_code == status.HTTP_401_UNAUTHORIZED
