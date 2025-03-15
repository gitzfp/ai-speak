from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.config import Config
from app.core.exceptions import UserAccessDeniedException
from app.core.logging import logging
from app.models.response import ApiResponse

from app.api.sys_routes import router as sys_routes
from app.api.account_routes import router as account_routes
from app.api.message_routes import router as message_routes
from app.api.session_routes import router as session_routes
from app.api.topics_route import router as topic_routes
from app.api.textbook_routes import router as textbook_routes
from app.api.alioss_routes import router as alioss_routes
from app.api.study_routes import router as study_routes

app = FastAPI()

# Enables CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(account_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(topic_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(sys_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(session_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(message_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(textbook_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(alioss_routes, prefix=f"{Config.API_PREFIX}/v1")
app.include_router(study_routes, prefix=f"{Config.API_PREFIX}/v1")
# Serve static files
app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.exception_handler(Exception)
async def conflict_error_handler(_, exc: Exception):
    """全局异常处理"""
    logging.error(exc)
    # 返回状态码仍为200，exc的错误信息放到ApiResponse中以json格式方式返回并且可以跨域访问
    return JSONResponse(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
        content=ApiResponse.system_error(message=str(exc)).__dict__,
    )


# UserAccessDeniedException异常处理状态码为403
@app.exception_handler(UserAccessDeniedException)
async def user_access_denied_error_handler(_, exc: UserAccessDeniedException):
    """全局异常处理"""
    logging.error(exc)
    # 返回状态码仍为200，exc的错误信息放到ApiResponse中以json格式方式返回并且可以跨域访问
    return JSONResponse(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
        content=ApiResponse(code="403", status=403, message=str(exc)).__dict__,
    )


@app.get("/health") 
def health_check(): 
    return 'OK', 200