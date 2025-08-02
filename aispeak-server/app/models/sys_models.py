from enum import Enum
from typing import List, Dict

from pydantic import BaseModel, constr

class UpdateLanguageDTO(BaseModel):
    language: constr(min_length=1)


class FeedbackDTO(BaseModel):
    content: constr(min_length=1)
    contact: str = None


class SystemSettingsResponse(BaseModel):
    """系统设置响应模型"""
    features: Dict[str, bool] = {}
    
    class Config:
        json_schema_extra = {
            "example": {
                "features": {
                    "showTextbookModule": False,
                    "enableManualInput": True
                }
            }
        }


class SystemSettingsUpdate(BaseModel):
    """系统设置更新模型"""
    features: Dict[str, bool] = None