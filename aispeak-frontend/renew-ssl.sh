#!/bin/bash

# Let's Encrypt 证书更新脚本

# 更新证书
certbot certonly --standalone -d dingguagua.fun --non-interactive --agree-tos --email your-email@example.com

# 复制新证书到项目目录
cp /etc/letsencrypt/live/dingguagua.fun/fullchain.pem ./ssl/dingguagua.fun.crt
cp /etc/letsencrypt/live/dingguagua.fun/privkey.pem ./ssl/dingguagua.fun.key
