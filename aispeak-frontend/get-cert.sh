#!/bin/bash

# 安装certbot
apt-get update
apt-get install -y certbot

# 获取证书
certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email 13928401083@163.com \
  -d dingguagua.fun \
  --non-interactive

# 创建ssl目录
mkdir -p ssl

# 复制证书到项目目录
cp /etc/letsencrypt/live/dingguagua.fun/fullchain.pem ssl/dingguagua.fun.crt
cp /etc/letsencrypt/live/dingguagua.fun/privkey.pem ssl/dingguagua.fun.key

# 设置权限
chmod 644 ssl/*
