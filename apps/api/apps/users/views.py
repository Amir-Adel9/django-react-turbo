from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from drf_spectacular.utils import extend_schema

from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, MeSerializer
from .cookies import set_auth_cookies, clear_auth_cookies


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """Return current user from access_token cookie (same shape as Register: email, name)."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MeSerializer})
    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_cookie_name = settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"]
        refresh_token = request.COOKIES.get(refresh_cookie_name)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        resp = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        clear_auth_cookies(resp)
        return resp


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_cookie_name = settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"]
        refresh_token = request.COOKIES.get(refresh_cookie_name)

        if not refresh_token:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except DRFValidationError:
            resp = Response({"detail": "Refresh token invalid."}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_auth_cookies(resp)

        access = serializer.validated_data["access"]
        new_refresh = serializer.validated_data.get("refresh")  # only if rotate enabled

        resp = Response({"ok": True}, status=status.HTTP_200_OK)
        set_auth_cookies(resp, access=access, refresh=new_refresh)
        return resp


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.pop("access", None)
            refresh_token = response.data.pop("refresh", None)
            set_auth_cookies(response, access=access_token, refresh=refresh_token)
        return response