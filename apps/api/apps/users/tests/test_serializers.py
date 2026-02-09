import pytest
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

from users.serializers import RegisterSerializer, MeSerializer

User = get_user_model()


class TestRegisterSerializer:
    def test_valid_registration(self, db):
        """Test valid user registration."""
        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'newuser@example.com'
        assert user.name == 'New User'
        assert user.check_password('SecurePass123!')

    def test_password_mismatch(self, db):
        """Test password mismatch validation."""
        data = {
            'email': 'user@example.com',
            'name': 'Test User',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass123!'
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_duplicate_email(self, db):
        """Test duplicate email validation."""
        User.objects.create_user(
            email='existing@example.com',
            name='Existing User',
            password='testpass123!'
        )
        data = {
            'email': 'existing@example.com',
            'name': 'New User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_weak_password(self, db):
        """Test weak password validation."""
        data = {
            'email': 'user@example.com',
            'name': 'Test User',
            'password': '123',
            'password_confirm': '123'
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_password_confirm_removed_on_create(self, db):
        """Test that password_confirm is removed before user creation."""
        data = {
            'email': 'user@example.com',
            'name': 'Test User',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        assert not hasattr(user, 'password_confirm')


class TestMeSerializer:
    def test_serialize_user(self, user):
        """Test serializing user data."""
        serializer = MeSerializer(user)
        data = serializer.data
        assert data['email'] == user.email
        assert data['name'] == user.name
        assert 'password' not in data
        assert 'id' not in data
