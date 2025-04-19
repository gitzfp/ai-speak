# 第一阶段：构建依赖（优化版）
FROM python:3.11-slim as builder

WORKDIR /aispeak-server
COPY requirements.txt .

# 安装编译依赖
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt
# RUN pip install --no-cache-dir safety && safety check --full-report
RUN pip install --no-cache-dir safety==2.3.5 && safety check --full-report

# 第二阶段：运行环境
FROM python:3.11-slim
WORKDIR /aispeak-server

# 复制依赖到系统目录
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用文件和数据文件
COPY ./app ./app
COPY ./data ./data
COPY ./files ./files
COPY ./static ./static

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    busybox \
    libasound2 \
    pulseaudio \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /bin/busybox /usr/local/bin/nc  # 使用busybox的nc

# 创建非root用户并设置权限
RUN addgroup --system appuser && adduser --system --no-create-home --ingroup appuser appuser && \
    chown -R appuser:appuser /aispeak-server

# 设置环境变量
ENV PYTHONPATH=/aispeak-server
ENV PATH="/usr/local/bin:${PATH}"

USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:8097/health || exit 1

# 启动命令
# 在 Dockerfile 或启动命令中修改
CMD ["gunicorn", "app.main:app", "--bind", "0.0.0.0:8097", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]