# AISpeak 部署文档

本文档提供 AISpeak 项目在生产环境的完整部署指南。

## 📋 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [故障排查](#故障排查)
- [维护指南](#维护指南)

## 系统要求

### 最低配置
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **系统**: Ubuntu 20.04+ / CentOS 7+
- **网络**: 公网IP，开放端口 80, 443, 8097

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL证书（用于HTTPS）

## 快速部署

使用自动化脚本快速部署：

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/your-repo/ai-speak/main/deploy.sh
chmod +x deploy.sh

# 运行部署
./deploy.sh
```

## 详细部署步骤

### 1. 环境准备

#### 安装 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

#### 安装其他依赖
```bash
sudo apt update
sudo apt install -y git curl wget
```

### 2. 克隆项目

```bash
cd /opt
git clone https://github.com/your-repo/ai-speak.git
cd ai-speak
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

必须配置的环境变量：

```bash
# ===== 数据库配置 =====
DATABASE_URL=mysql://aispeak:your_password@mysql:3306/aispeak_db

# ===== JWT 安全配置 =====
TOKEN_SECRET=your-secret-key-at-least-32-characters
TOKEN_EXPIRE_TIME=86400

# ===== 微信小程序配置 =====
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WE_CHAT_SERVER_URL=https://api.weixin.qq.com

# ===== AI 服务配置 =====
AI_SERVER=openai
CHAT_GPT_KEY=your_openai_api_key
CHAT_GPT_MODEL=gpt-3.5-turbo
CHAT_GPT_PROXY=https://api.openai.com

# ===== 微软语音服务 =====
AZURE_KEY=your_azure_speech_key
AZURE_REGIEON=eastasia

# ===== 阿里云 OSS（可选）=====
ALIBABA_CLOUD_ACCESS_KEY_ID=your_oss_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_oss_key_secret

# ===== 其他配置 =====
TEMP_SAVE_FILE_PATH=/aispeak-server/files
SQL_ECHO=false
API_PREFIX=/api/v1
```

### 4. 配置前端

编辑前端配置文件：

```bash
# 修改 API 地址
nano aispeak-frontend/src/config/index.ts
```

更新为你的域名：
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api/v1'
  : 'http://localhost:8097/api/v1'
```

### 5. 准备 SSL 证书

```bash
# 创建 SSL 目录
mkdir -p aispeak-frontend/ssl

# 复制你的 SSL 证书
cp /path/to/your-domain.crt aispeak-frontend/ssl/
cp /path/to/your-domain.key aispeak-frontend/ssl/

# 更新 nginx 配置
sed -i 's/dingguagua.fun/your-domain.com/g' aispeak-frontend/nginx.conf
```

### 6. 构建和启动服务

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 7. 初始化数据库

```bash
# 进入后端容器
docker-compose exec backend bash

# 运行数据库迁移
cd /aispeak-server
alembic upgrade head

# 退出容器
exit
```

## 配置说明

### 域名配置

1. **DNS 解析**
   - A 记录：将域名指向服务器 IP
   - 如果使用 CDN，配置相应的 CNAME

2. **Nginx 配置**
   - 自动包含 HTTP 到 HTTPS 重定向
   - WebSocket 支持已配置
   - 静态文件缓存已优化

### 数据持久化

- **文件存储**: `./files` 目录
- **数据库**: 使用外部 MySQL 或添加 MySQL 容器
- **日志**: `./logs` 目录

### 安全配置

1. **防火墙规则**
```bash
# 使用 ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **定期更新**
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新 Docker 镜像
docker-compose pull
docker-compose up -d
```

## 微信小程序部署

### 1. 构建小程序

```bash
cd aispeak-frontend
npm install
npm run build:mp-weixin
```

### 2. 配置小程序

1. 登录[微信公众平台](https://mp.weixin.qq.com)
2. 开发 > 开发设置 > 服务器域名
3. 添加以下域名：
   - request合法域名: `https://your-domain.com`
   - uploadFile合法域名: `https://your-domain.com`
   - downloadFile合法域名: `https://your-domain.com`

### 3. 上传代码

1. 使用微信开发者工具打开 `dist/build/mp-weixin`
2. 上传代码并设置为体验版
3. 提交审核

## 故障排查

### 常见问题

1. **容器启动失败**
```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
sudo netstat -tlnp | grep -E '80|443|8097'
```

2. **数据库连接失败**
```bash
# 测试数据库连接
docker-compose exec backend mysql -h mysql -u aispeak -p

# 检查环境变量
docker-compose exec backend env | grep DATABASE
```

3. **文件上传失败**
```bash
# 检查文件权限
ls -la ./files

# 修复权限
sudo chown -R 1001:1001 ./files
```

### 日志位置

- **后端日志**: `docker-compose logs backend`
- **前端日志**: `docker-compose logs frontend`
- **Nginx日志**: `docker-compose exec frontend tail -f /var/log/nginx/access.log`

## 维护指南

### 日常维护

1. **备份数据**
```bash
# 备份脚本已包含在 deploy.sh 中
./deploy.sh backup
```

2. **监控服务**
```bash
# 健康检查
curl https://your-domain.com/api/v1/health

# 系统资源
docker stats
```

3. **更新应用**
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh update
```

### 性能优化

1. **调整 Worker 数量**
   编辑 `docker-compose.yml`:
   ```yaml
   command: gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
   ```

2. **配置缓存**
   - 启用 Redis 缓存（需要额外配置）
   - 配置 CDN 加速静态资源

3. **数据库优化**
   - 定期清理过期数据
   - 添加必要的索引

### 监控告警

建议配置以下监控：

1. **服务监控**
   - Uptime 监控
   - API 响应时间
   - 错误率

2. **资源监控**
   - CPU/内存使用率
   - 磁盘空间
   - 网络流量

3. **业务监控**
   - 用户活跃度
   - API 调用量
   - 错误日志

## 安全建议

1. **定期更新依赖**
```bash
# 检查 Python 依赖安全性
docker-compose exec backend safety check

# 更新依赖
docker-compose exec backend pip install -U -r requirements.txt
```

2. **访问控制**
   - 使用强密码
   - 定期轮换密钥
   - 限制数据库访问

3. **备份策略**
   - 每日自动备份
   - 异地备份存储
   - 定期恢复测试

## 技术支持

- 项目仓库: https://github.com/your-repo/ai-speak
- 问题反馈: https://github.com/your-repo/ai-speak/issues
- 邮箱: 13928401083@163.com

---

最后更新: 2024-01-29