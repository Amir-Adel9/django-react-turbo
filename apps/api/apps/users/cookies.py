from django.conf import settings

def set_auth_cookies(response, *, access: str | None = None, refresh: str | None = None):

    if access:
        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE"],
            value=access,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            path="/",
        )

    if refresh:
        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
            value=refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            path="/",
        )

    return response


def clear_auth_cookies(response):
    opts = {
        "path": "/",
        "samesite": settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    }
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"], **opts)
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"], **opts)
    return response
