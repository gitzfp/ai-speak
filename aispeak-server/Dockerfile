# 第一阶段：构建依赖
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --user --no-cache-dir -r requirements.txt
RUN pip install safety && safety check --full-report

# 第二阶段：运行环境
FROM python:3.11-slim
WORKDIR /app

COPY --from=builder /root/.local /root/.local
COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system appuser && adduser --system --no-create-home --ingroup appuser appuser
USER appuser

CMD ["sh", "-c", "until mysqladmin ping -h db -u${DB_USER} -p${DB_PASSWORD} --silent; do sleep 2; done && alembic upgrade head && gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8097"]