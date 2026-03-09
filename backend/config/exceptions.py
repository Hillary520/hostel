from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "code": "internal_error",
                "message": "An unexpected error occurred.",
                "details": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    default_code = "error"
    if hasattr(exc, "default_code"):
        default_code = str(exc.default_code)

    detail = response.data
    message = "Request failed."
    if isinstance(detail, dict) and "detail" in detail:
        message = str(detail["detail"])
    elif isinstance(detail, list) and detail:
        message = str(detail[0])

    response.data = {
        "code": default_code,
        "message": message,
        "details": detail,
    }
    return response
