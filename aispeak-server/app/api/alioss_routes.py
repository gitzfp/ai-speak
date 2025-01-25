from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Response
import oss2
from app.models.response import ApiResponse  # 导入 ApiResponse
import m3u8
import aiohttp
from Crypto.Cipher import AES

router = APIRouter()

region = 'oss-cn-beijing'
auth = oss2.Auth('LTAI5tMjmUPHEitz9RNi7QjJ', 'xxcNZWIAQmUqeoW1TaIekQz9WGyOsW')
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


@router.get("/ali-oss/get-decrypted-audio/")
async def get_decrypted_audio(oss_key: str, book_id: str):
    try:
        # 1. First get the m3u8 content
        if not bucket.object_exists(oss_key):
            return ApiResponse.error("M3U8文件不存在", code=404)
            
        result = bucket.get_object(oss_key)
        m3u8_content = result.read().decode('utf-8')
        
        # 2. Parse m3u8 content
        playlist = m3u8.loads(m3u8_content)
        
        # Check if there are any segments
        if not playlist.segments:
            return ApiResponse.error("M3U8文件没有音频片段", code=400)
            
        # Get the first segment and its corresponding decrypted key
        ts_url = playlist.segments[0].uri
        ts_filename = ts_url.split('/')[-1]
        decrypted_key = f"decrypted/{book_id}/{ts_filename}"
        
        # 3. Check if decrypted file exists
        if bucket.object_exists(decrypted_key):
            return ApiResponse.success(data={"url": f"{public_endpoint}/{decrypted_key}"})
            
        # 4. Get encryption key info
        if not playlist.keys or not playlist.keys[0]:
            return ApiResponse.error("未找到加密信息", code=400)
            
        key_info = playlist.keys[0]
        
        # 5. Download key and ts file
        async with aiohttp.ClientSession() as session:
            # Download encryption key
            async with session.get(key_info.uri) as response:
                if response.status != 200:
                    return ApiResponse.error("获取密钥失败", code=response.status)
                key_data = await response.read()
                
            # Download ts file
            async with session.get(ts_url) as response:
                if response.status != 200:
                    return ApiResponse.error("获取音频文件失败", code=response.status)
                ts_data = await response.read()
        
        # 6. Decrypt
        if key_info.iv:
            iv = bytes.fromhex(key_info.iv[2:])  # Remove '0x' prefix
        else:
            # If IV is not provided, use zeros
            iv = b'\0' * 16
            
        cipher = AES.new(key_data, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(ts_data)
        
        # 7. Save to OSS
        bucket.put_object(decrypted_key, decrypted_data)
        
        return ApiResponse.success(data={"url": f"{public_endpoint}/{decrypted_key}"})
        
    except Exception as e:
        print(f"Decryption error: {str(e)}")  # Add detailed error logging
        return ApiResponse.system_error(f"音频解密失败: {str(e)}")



@router.api_route("/ap22/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_mypep(request: Request, path: str):
    """
    代理转发到 diandu.mypep.cn 的请求
    """
    target_url = f"https://diandu.mypep.cn/{path}"
    
    try:
        # 获取原始请求的方法、headers 和 body
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # 移除一些不需要转发的 headers
        headers.pop('host', None)
        headers.pop('connection', None)
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=target_url,
                headers=headers,
                data=body
            ) as response:
                content = await response.read()
                return Response(
                    content=content,
                    status_code=response.status,
                    headers=dict(response.headers)
                )
            
    except Exception as e:
        return ApiResponse.system_error(f"代理请求失败: {str(e)}")

    """
    代理转发到 diandu.mypep.cn 的请求
    """
    target_url = f"https://diandu.mypep.cn/{path}"
    
    try:
        # 获取原始请求的方法、headers 和 body
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # 移除一些不需要转发的 headers
        headers.pop('host', None)
        headers.pop('connection', None)
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=target_url,
                headers=headers,
                content=body
            )
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
    except Exception as e:
        return ApiResponse.system_error(f"代理请求失败: {str(e)}")

@router.api_route("/ap33/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_mypep_api(request: Request, path: str):
    """
    代理转发到 api.mypep.com.cn 的请求
    """
    target_url = f"https://api.mypep.com.cn/{path}"
    
    try:
        # 获取原始请求的方法、headers 和 body
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # 移除一些不需要转发的 headers
        headers.pop('host', None)
        headers.pop('connection', None)
        
        # 添加自定义请求头
        headers.update({
            'Origin': 'https://diandu.mypep.cn',
            'Referer': 'https://diandu.mypep.cn/'
        })
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=target_url,
                headers=headers,
                data=body
            ) as response:
                content = await response.read()
                return Response(
                    content=content,
                    status_code=response.status,
                    headers=dict(response.headers)
                )
            
    except Exception as e:
        return ApiResponse.system_error(f"代理请求失败: {str(e)}")

# ... rest of the code ...