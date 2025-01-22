from fastapi import APIRouter, UploadFile, File
import oss2
from app.models.response import ApiResponse  # 导入 ApiResponse
from app.config import Config

router = APIRouter()

region = 'oss-cn-beijing'
auth = oss2.Auth(Config.alioss_access_key_id, Config.alioss_access_key_secret)
bucket_name = 'books-bct'
endpoint = f"https://{region}.aliyuncs.com"
bucket = oss2.Bucket(auth, endpoint, bucket_name)

# Update the URL format for public access
public_endpoint = f"https://books-bct.{region}.aliyuncs.com"  # Public access endpoint

@router.get("/ali-oss/check-file/")
async def check_file(oss_key: str):
    """
    检查文件是否已存储在阿里云 OSS 中
    """
    try:
        if bucket.object_exists(oss_key):
            return ApiResponse.success(data={"exists": True, "url": f"{public_endpoint}/{oss_key}"})
        else:
            return ApiResponse.success(data={"exists": False})
    except Exception as e:
        return ApiResponse.system_error(f"检查文件失败: {str(e)}")

@router.post("/ali-oss/upload-file/")
async def upload_file(oss_key: str, file: UploadFile = File(...)):
    """
    上传文件到阿里云 OSS
    """
    try:
        bucket.put_object(oss_key, await file.read())
        return ApiResponse.success(data={"oss_key": oss_key}, message="文件上传成功")
    except Exception as e:
        return ApiResponse.system_error(f"文件上传失败: {str(e)}")

@router.get("/ali-oss/get-file/")
async def get_file(oss_key: str):
    """
    从阿里云 OSS 获取文件内容
    """
    try:
        print(f"Checking if file exists in OSS with key: {oss_key}")
        if not bucket.object_exists(oss_key):
            print("File does not exist")
            return ApiResponse.error("文件不存在", code=404)

        # 根据文件扩展名判断类型
        file_extension = oss_key.split('.')[-1].lower() if '.' in oss_key else ''
        
        # 文本文件类型
        text_extensions = {'json', 'txt', 'm3u8'}
        # 二进制文件类型
        binary_extensions = {'jpg', 'jpeg', 'png', 'gif', 'mp3', 'mp4', 'wav'}

        if file_extension in text_extensions:
            # 获取并解码文本内容
            result = bucket.get_object(oss_key)
            file_content = result.read()
            return ApiResponse.success(data={"content": file_content.decode('utf-8')})
        elif file_extension in binary_extensions:
            # 返回文件 URL
            file_url = f"{public_endpoint}/{oss_key}"
            return ApiResponse.success(data={"url": file_url})
        else:
            # 未知文件类型，返回错误
            return ApiResponse.error(f"不支持的文件类型: {file_extension}", code=400)

    except Exception as e:
        print(f"Error retrieving file: {str(e)}")
        return ApiResponse.system_error(f"获取文件失败: {str(e)}")