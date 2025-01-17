# 使用官方的Python 3.12基础镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件到工作目录
COPY requirements.txt .

# 安装项目依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件到工作目录
COPY . .

# 暴露应用端口
EXPOSE 8097

# 运行应用
CMD ["nohup", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8097", "&"]