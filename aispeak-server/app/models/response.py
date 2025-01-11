from pydantic import BaseModel
from typing import Optional, Any

class ApiResponse(BaseModel):
    code: int = 1000
    message: str = "success"
    data: Optional[Any] = None
    status: int = 200

    @staticmethod
    def success(data: Any = None, message: str = "success") -> "ApiResponse":
        return ApiResponse(code=1000, message=message, data=data, status=200)

    @staticmethod
    def error(message: str, code: int = 1001) -> "ApiResponse":
        return ApiResponse(code=code, message=message, data=None, status=200)

    @staticmethod
    def system_error(message: str) -> "ApiResponse":
        return ApiResponse(code=1002, message=message, data=None, status=500)
