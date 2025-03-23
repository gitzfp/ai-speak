from fastapi import APIRouter
import logging
router = APIRouter()

@router.get("/health")
def health_check(): 
    return 'OK', 200

@router.get("/test-error")
async def trigger_error():
    print("This is a test error")
    logging.info("This is a test error")
    raise ValueError("This is a test exception")