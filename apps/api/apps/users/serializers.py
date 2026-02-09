from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'password_confirm')

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        email = data.get("email")
        if email and User.objects.filter(email=User.objects.normalize_email(email)).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        # Use an unsaved User instance so Django's validators (e.g. UserAttributeSimilarityValidator) can use _meta
        user_for_validation = User(
            email=data.get("email", ""),
            name=data.get("name", ""),
            first_name=data.get("name", ""),
            last_name="",
        )
        try:
            validate_password(data["password"], user=user_for_validation)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class MeSerializer(serializers.ModelSerializer):
    """Read-only serializer for GET /api/auth/me (same shape as Register for API contract)."""

    class Meta:
        model = User
        fields = ('email', 'name')
        read_only_fields = ('email', 'name')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data['user'] = {
            'email': self.user.email,
            'name': self.user.name,
        }
        return data