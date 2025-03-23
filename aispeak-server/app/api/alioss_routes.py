from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Response
import oss2
from app.models.response import ApiResponse  # 导入 ApiResponse
import m3u8
import aiohttp
from Crypto.Cipher import AES
from urllib.parse import unquote
import ffmpeg
import os
import base64

import logging
logger = logging.getLogger(__name__)

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
async def upload_file(request: Request, oss_key: str, file: UploadFile = File(None)):
    """
    上传文件到阿里云 OSS...
    """
    try:
        if file:
            # 添加上传结果检查
            result = bucket.put_object(oss_key, await file.read())
            if result.status != 200:
                print(f"OSS上传失败，状态码：{result.status}")
                return ApiResponse.error("OSS服务返回错误", code=result.status)
                
        return ApiResponse.success(data={"oss_key": oss_key,  "url": f"{public_endpoint}/{oss_key}"}, message="上传成功")
    except Exception as e:
        return ApiResponse.system_error(f"上传失败: {str(e)}")

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

@router.get("/ali-oss/get-binary-file/")
async def get_file(oss_key: str):
    """
    从阿里云 OSS 获取文件内容
    """
    try:
        print(f"Checking if file exists in OSS with key: {oss_key}")
        if not bucket.object_exists(oss_key):
            return ApiResponse.error("文件不存在", code=404)
        
        # 获取文件内容
        result = bucket.get_object(oss_key)
        content = result.read()
        
        # 将二进制内容转换为 base64 字符串
        base64_content = base64.b64encode(content).decode('utf-8')
        
        # 返回 base64 编码的内容
        return ApiResponse.success(data={
            "content": base64_content,
            "type": "zip"
        })
       
    except Exception as e:
        print(f"Error retrieving file: {str(e)}")
        return ApiResponse.system_error(f"获取文件失败: {str(e)}") 

async def fetch_with_proxy(url: str) -> str:
    """模拟 vite 代理请求获取 m3u8 内容"""
    logger.info(f"开始代理请求: {url}")
    async with aiohttp.ClientSession() as session:
        headers = {
            'Origin': 'https://diandu.mypep.cn',
            'Referer': 'https://diandu.mypep.cn/',
            'Accept': '*/*'
        }
        logger.info(f"请求头: {headers}")
        async with session.get(url, headers=headers) as response:
            logger.info(f"响应状态码: {response.status}")
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="代理请求失败")
            content = await response.text()
            logger.info(f"响应内容长度: {len(content)}")
            return content

@router.get("/ali-oss/decrypt-and-upload2/")
async def decrypt_and_upload(oss_key: str, url: str):
    """解密并上传音频文件"""
    try:
        # 1. 解码 URL 参数
        oss_key = unquote(oss_key)
        m3u8_url = unquote(url)
        logger.info(f"ossKey: {oss_key}, m3u8_url: {m3u8_url}")

        # 2. 获取 M3U8 文件内容
        logger.info("开始下载 M3U8 文件...")
        m3u8_content = await fetch_with_proxy(m3u8_url)
        logger.info(f"M3U8 文件内容: {m3u8_content}")

        # 3. 解析 M3U8 文件
        logger.info("开始解析 M3U8 文件...")
        playlist = m3u8.loads(m3u8_content)

        # 检查是否有音频片段
        if not playlist.segments:
            logger.error("M3U8 文件没有音频片段")
            return ApiResponse.error("M3U8 文件没有音频片段", code=400)

        # 获取第一个片段的 URL
        ts_url = playlist.segments[0].uri
        ts_filename = ts_url.split('/')[-1]
        decrypted_key = f"decrypted/{oss_key.split('/')[-1].replace('.m3u8', '.ts')}"
        logger.info(f"TS 文件 URL: {ts_url}, 解密后文件名: {decrypted_key}")

        # 4. 检查是否已存在解密文件
        if bucket.object_exists(decrypted_key):
            logger.info("解密文件已存在，直接返回 URL")
            # return ApiResponse.success(data={"url": f"{public_endpoint}/{decrypted_key}"})

        # 5. 获取加密信息
        if not playlist.keys or not playlist.keys[0]:
            logger.error("未找到加密信息")
            return ApiResponse.error("未找到加密信息", code=400)

        key_info = playlist.keys[0]
        logger.info(f"密钥信息: URI={key_info.uri}, IV={key_info.iv}")

        # 6. 下载密钥和 TS 文件
        async with aiohttp.ClientSession() as session:
            # 下载密钥
            logger.info("开始下载密钥...")
            async with session.get(key_info.uri) as response:
                if response.status != 200:
                    logger.error(f"获取密钥失败，状态码: {response.status}")
                    return ApiResponse.error("获取密钥失败", code=response.status)
                key_data = await response.read()
                logger.info(f"密钥下载成功，密钥长度: {len(key_data)}")

            # 下载 TS 文件
            logger.info("开始下载 TS 文件...")
            async with session.get(ts_url) as response:
                if response.status != 200:
                    logger.error(f"获取音频文件失败，状态码: {response.status}")
                    return ApiResponse.error("获取音频文件失败", code=response.status)
                ts_data = await response.read()
                logger.info(f"TS 文件下载成功，文件长度: {len(ts_data)}")

        # 7. 解密
        if key_info.iv:
            iv = bytes.fromhex(key_info.iv[2:])  # 去掉 '0x' 前缀
        else:
            iv = b'\0' * 16  # 如果未提供 IV，使用默认值
        logger.info(f"IV 值: {iv}")

        logger.info("开始解密 TS 文件...")
        cipher = AES.new(key_data, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(ts_data)
        logger.info(f"解密成功，解密后文件长度: {len(decrypted_data)}")

        # 检查解密后的数据长度
        if len(decrypted_data) != len(ts_data):
            logger.error("解密后的文件长度与原始文件不一致")
            return ApiResponse.error("解密失败，文件长度不一致", code=500)

        # 8. 保存解密后的文件到 OSS
        logger.info("开始上传解密文件到 OSS...")
        bucket.put_object(decrypted_key, decrypted_data)
        logger.info(f"解密文件已上传到 OSS: {decrypted_key}")

        # 9. 生成新的 M3U8 文件内容
        new_m3u8_content = f"""#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:3.889722,
{public_endpoint}/{decrypted_key}
#EXT-X-ENDLIST
"""
        logger.info(f"生成的 M3U8 文件内容:\n{new_m3u8_content}")

        # 10. 上传新的 M3U8 文件到 OSS，覆盖原来的文件
        logger.info("开始上传新的 M3U8 文件到 OSS（覆盖原文件）...")
        bucket.put_object(oss_key, new_m3u8_content)  # 直接使用原始的 oss_key
        logger.info(f"新的 M3U8 文件已上传到 OSS: {oss_key}")

        # 11. 返回原始的 M3U8 文件的 URL
        return ApiResponse.success(data={"url": f"{public_endpoint}/{oss_key}"})

    except Exception as e:
        logger.error(f"解密并转存失败: {str(e)}", exc_info=True)
        return ApiResponse.system_error(f"音频解密失败: {str(e)}")


async def convert_to_mp3(input_file: str, output_file: str):
    """使用 FFmpeg 将文件转换为 MP3"""
    # 确保输出文件的目录存在
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # 使用绝对路径
    input_file = os.path.abspath(input_file)
    output_file = os.path.abspath(output_file)

    # 检查输入文件是否存在
    if not os.path.exists(input_file):
        logger.error(f"输入文件不存在: {input_file}")
        raise FileNotFoundError(f"输入文件不存在: {input_file}")

    # 调用 FFmpeg
    ffmpeg.input(input_file).output(output_file, acodec='libmp3lame').run()

@router.get("/ali-oss/decrypt-and-upload/")
async def decrypt_and_upload(oss_key: str, url: str):
    """解密并上传音频文件，转换为 MP3"""
    try:
        # 1. 解码 URL 参数
        m3u8_url = url
        logger.info(f"ossKey: {oss_key}, m3u8_url: {m3u8_url}")

        # 2. 获取 M3U8 文件内容
        logger.info("开始下载 M3U8 文件...")
        m3u8_content = await fetch_with_proxy(m3u8_url)
        logger.info(f"M3U8 文件内容: {m3u8_content}")

        # 3. 解析 M3U8 文件
        logger.info("开始解析 M3U8 文件...")
        playlist = m3u8.loads(m3u8_content)

        # 检查是否有音频片段
        if not playlist.segments:
            logger.error("M3U8 文件没有音频片段")
            return ApiResponse.error("M3U8 文件没有音频片段", code=400)

        # 获取第一个片段的 URL
        ts_url = playlist.segments[0].uri
        ts_filename = ts_url.split('/')[-1]
        decrypted_key = f"decrypted/{oss_key.split('/')[-1].replace('.m3u8', '.ts')}"
        logger.info(f"TS 文件 URL: {ts_url}, 解密后文件名: {decrypted_key}")

        # 4. 检查是否已存在解密文件
        if bucket.object_exists(decrypted_key):
            logger.info("解密文件已存在，直接返回 URL")
            # return ApiResponse.success(data={"url": f"{public_endpoint}/{decrypted_key}"})

        # 5. 获取加密信息
        if not playlist.keys or not playlist.keys[0]:
            logger.error("未找到加密信息")
            return ApiResponse.error("未找到加密信息", code=400)

        key_info = playlist.keys[0]
        logger.info(f"密钥信息: URI={key_info.uri}, IV={key_info.iv}")

        # 6. 下载密钥和 TS 文件
        async with aiohttp.ClientSession() as session:
            # 下载密钥
            logger.info("开始下载密钥...")
            async with session.get(key_info.uri) as response:
                if response.status != 200:
                    logger.error(f"获取密钥失败，状态码: {response.status}")
                    return ApiResponse.error("获取密钥失败", code=response.status)
                key_data = await response.read()
                logger.info(f"密钥下载成功，密钥长度: {len(key_data)}")

            # 下载 TS 文件
            logger.info("开始下载 TS 文件...")
            async with session.get(ts_url) as response:
                if response.status != 200:
                    logger.error(f"获取音频文件失败，状态码: {response.status}")
                    return ApiResponse.error("获取音频文件失败", code=response.status)
                ts_data = await response.read()
                logger.info(f"TS 文件下载成功，文件长度: {len(ts_data)}")

        # 7. 解密
        if key_info.iv:
            iv = bytes.fromhex(key_info.iv[2:])  # 去掉 '0x' 前缀
        else:
            iv = b'\0' * 16  # 如果未提供 IV，使用默认值
        logger.info(f"IV 值: {iv}")

        logger.info("开始解密 TS 文件...")
        cipher = AES.new(key_data, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(ts_data)
        logger.info(f"解密成功，解密后文件长度: {len(decrypted_data)}")

        # 检查解密后的数据长度
        if len(decrypted_data) != len(ts_data):
            logger.error("解密后的文件长度与原始文件不一致")
            return ApiResponse.error("解密失败，文件长度不一致", code=500)

        # 8. 保存解密后的 TS 文件
        decrypted_ts_filename = "decrypted.ts"
        with open(decrypted_ts_filename, 'wb') as f:
            f.write(decrypted_data)
        logger.info(f"解密后的 TS 文件已保存: {decrypted_ts_filename}")

        # 9. 转换为 MP3
        mp3_filename = oss_key.replace('.m3u8', '.mp3')
        await convert_to_mp3(decrypted_ts_filename, mp3_filename)
        logger.info(f"文件转换为 MP3 成功: {mp3_filename}")

        # 10. 上传 MP3 文件到 OSS
        with open(mp3_filename, 'rb') as f:
            bucket.put_object(mp3_filename, f)
        logger.info(f"MP3 文件已上传到 OSS: {mp3_filename}")

        # 11. 清理临时文件
        os.remove(decrypted_ts_filename)
        os.remove(mp3_filename)

        # 12. 返回 MP3 文件的 URL
        return ApiResponse.success(data={"url": f"{public_endpoint}/{mp3_filename}"})

    except Exception as e:
        logger.error(f"解密并转存失败: {str(e)}", exc_info=True)
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

# 添加一个通用的代理函数
@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_request(request: Request, custom_headers: dict = None) -> Response:
    """
    通用的代理请求函数
    """
    try:
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # 移除不需要转发的 headers
        headers.pop('host', None)
        headers.pop('connection', None)
        
        # 添加自定义请求头
        if custom_headers:
            headers.update(custom_headers)
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url="https://diandu.mypep.cn/book/getBookUrl.json",
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