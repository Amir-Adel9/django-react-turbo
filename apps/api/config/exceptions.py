"""
Custom DRF exception handler so all API errors return a consistent JSON shape
with a "detail" key. Validation errors keep their field structure under "detail".
"""
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        # DRF already returns {"detail": ...} for most APIException cases.
        # Ensure we always expose a "detail" key (keep existing body if present).
        if "detail" not in response.data:
            response.data = {"detail": response.data}
        return response
    # Non-DRF exceptions (e.g. unhandled Python errors): return 500 with generic message.
    return Response(
        {"detail": "Internal server error."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
