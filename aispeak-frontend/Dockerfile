# 第一阶段：构建环境
FROM node:20-alpine AS builder

# 1. 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    openssh-client

# 2. 安装 Yarn 1.22.2
RUN npm install -g yarn@1.22.22 --force

# 3. 验证环境
RUN echo "Node: $(node -v)" && \
    echo "Yarn: $(yarn -v)" && \
    echo "Python: $(python3 --version)"

WORKDIR /app

# 4. 优先复制包管理文件及配置文件
COPY package.json yarn.lock ./

# 5. Yarn 1.x 安装优化
RUN set -x \
    # 清理旧缓存
    && yarn cache clean \
    # 安装依赖（使用离线缓存）
    && yarn install --frozen-lockfile \
    # 验证安装
    && [ -d "node_modules" ] || (echo "依赖安装失败！"; exit 1)

# 6. 复制源码并构建
COPY . .
RUN yarn build:h5

# 第二阶段：生产环境
FROM nginx:1.25-alpine

# 7. 时区与权限（Alpine 优化版）
RUN apk add --no-cache tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && mkdir -p /etc/nginx/ssl \
    && chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/ssl \
    && chmod -R 755 /usr/share/nginx/html

COPY --from=builder --chown=nginx:nginx /app/dist/build/h5 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 复制SSL证书（需要你先准备好这些文件）
COPY ssl/dingguagua.fun.crt /etc/nginx/ssl/
COPY ssl/dingguagua.fun.key /etc/nginx/ssl/

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
