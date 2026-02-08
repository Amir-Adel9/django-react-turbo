from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer
from .cookies import set_auth_cookies, clear_auth_cookies

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
   
    permission_classes = [IsAuthenticated]

    def post(self, _request):
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
        except Exception:
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
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            set_auth_cookies(response, access=access_token, refresh=refresh_token)

            del response.data['access']
            del response.data['refresh']
            
        return response