from django.contrib import admin
from django.urls import path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from users.views import (
    CookieTokenRefreshView,
    CustomTokenObtainPairView,
    LogoutView,
    RegisterView,
)

urlpatterns = [
    # path('admin/', admin.site.urls),

    # OpenAPI schema (for gen-schema and api-contract)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    re_path(
        r'^api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    # Auth endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
]
