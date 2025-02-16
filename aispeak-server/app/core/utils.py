import oss2
import requests

# 阿里云OSS配置
OSS_REGION = 'oss-cn-beijing'
OSS_AUTH = oss2.Auth('LTAI5tMjmUPHEitz9RNi7QjJ', 'xxcNZWIAQmUqeoW1TaIekQz9WGyOsW')
OSS_BUCKET_NAME = 'books-bct'
OSS_ENDPOINT = f"https://{OSS_REGION}.aliyuncs.com"
OSS_BUCKET = oss2.Bucket(OSS_AUTH, OSS_ENDPOINT, OSS_BUCKET_NAME)
OSS_PUBLIC_ENDPOINT = f"https://books-bct.{OSS_REGION}.aliyuncs.com"

async def download_and_upload_to_oss(url: str, folder: str, filename: str) -> str:
    """
    下载文件并上传到阿里云OSS
    
    Args:
        url: 源文件URL
        folder: OSS存储文件夹
        filename: 文件名(可包含子文件夹)
    
    Returns:
        str: OSS访问URL
    """
    try:
        if not url:
            return ""
            
        oss_key = f"{folder}/{filename}"
        
        # 检查文件是否已存在
        if OSS_BUCKET.object_exists(oss_key):
            print(f"Object {oss_key} already exists in OSS, skipping upload.")
        else:
            response = requests.get(url)
            response.raise_for_status()
            OSS_BUCKET.put_object(oss_key, response.content)
            
        return f"{OSS_PUBLIC_ENDPOINT}/{oss_key}"
    except Exception as e:
        print(f"Error uploading file {url} to OSS: {str(e)}")
        return url

