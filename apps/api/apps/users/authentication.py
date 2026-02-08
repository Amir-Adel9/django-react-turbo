# Right$Hero
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Look for the token in the cookie (name defined in settings)
        header = self.get_header(request)
        
        if header is None:
            # If no 'Authorization' header is found, check cookies
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        else:
            # If a header exists, extract the token from it
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # 2. Use the base class logic to validate the token and find the user
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token