# 使用Node.js 18 LTS作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件到工作目录
COPY . .

# 构建项目
RUN npm run build

# 使用Nginx来服务构建后的静态文件
FROM nginx:alpine

# 复制构建后的静态文件到Nginx的默认静态文件目录
COPY --from=0 /app/dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]