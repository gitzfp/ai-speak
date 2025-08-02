#!/bin/bash

# Let's Encrypt 证书更新脚本

# 停止 nginx 以释放端口
docker-compose stop nginx

# 更新证书
certbot certonly --standalone -d dingguagua.fun --non-interactive --agree-tos --email your-email@example.com

# 复制新证书到项目目录
cp /etc/letsencrypt/live/dingguagua.fun/fullchain.pem ./ssl/dingguagua.fun.crt
cp /etc/letsencrypt/live/dingguagua.fun/privkey.pem ./ssl/dingguagua.fun.key

# 重启 nginx
docker-compose start nginx

echo "SSL证书已更新！"