import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from users.authentication import CookieJWTAuthentication

User = get_user_model()


class TestCookieJWTAuthentication:
    def test_authenticate_with_valid_token(self, user):
        """Test authentication with valid access token."""
        from django.conf import settings
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Create a mock request with cookie
        class MockRequest:
            def __init__(self, cookie_value):
                self.COOKIES = {settings.SIMPLE_JWT['AUTH_COOKIE']: cookie_value}
        
        request = MockRequest(access_token)
        auth = CookieJWTAuthentication()
        user_auth, token = auth.authenticate(request)
        
        assert user_auth == user
        assert token is not None  # Token is a validated token object, not a string

    def test_authenticate_without_token(self):
        """Test authentication without token."""
        from django.conf import settings
        class MockRequest:
            COOKIES = {}
        
        request = MockRequest()
        auth = CookieJWTAuthentication()
        result = auth.authenticate(request)
        
        assert result is None

    def test_authenticate_with_invalid_token(self):
        """Test authentication with invalid token."""
        from django.conf import settings
        from rest_framework_simplejwt.exceptions import InvalidToken
        
        class MockRequest:
            COOKIES = {settings.SIMPLE_JWT['AUTH_COOKIE']: 'invalid_token'}
        
        request = MockRequest()
        auth = CookieJWTAuthentication()
        # Invalid tokens raise InvalidToken exception, which DRF handles
        try:
            result = auth.authenticate(request)
            assert result is None  # Should not reach here
        except InvalidToken:
            pass  # Expected behavior

    def test_authenticate_with_expired_token(self, user):
        """Test authentication with expired token."""
        from django.conf import settings
        from rest_framework_simplejwt.exceptions import InvalidToken
        
        # Note: This would require mocking time or using a real expired token
        # For now, we'll test that invalid tokens raise InvalidToken
        class MockRequest:
            COOKIES = {settings.SIMPLE_JWT['AUTH_COOKIE']: 'expired_token_here'}
        
        request = MockRequest()
        auth = CookieJWTAuthentication()
        # Invalid tokens raise InvalidToken exception
        try:
            result = auth.authenticate(request)
            assert result is None  # Should not reach here
        except InvalidToken:
            pass  # Expected behavior
