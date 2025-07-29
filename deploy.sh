#!/bin/bash

# AISpeak 自动化部署脚本
# 作者: AISpeak Team
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="aispeak"
PROJECT_DIR="/opt/ai-speak"
BACKUP_DIR="/opt/backups/aispeak"
LOG_FILE="/var/log/aispeak-deploy.log"
DOMAIN=""
EMAIL=""

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[错误]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[警告]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[信息]${NC} $1" | tee -a "$LOG_FILE"
}

# 显示帮助信息
show_help() {
    cat << EOF
AISpeak 部署脚本使用说明

用法: ./deploy.sh [命令] [选项]

命令:
    install     - 全新安装 AISpeak
    update      - 更新到最新版本
    backup      - 备份数据
    restore     - 恢复数据
    start       - 启动服务
    stop        - 停止服务
    restart     - 重启服务
    status      - 查看服务状态
    logs        - 查看日志
    ssl         - 配置 SSL 证书
    help        - 显示此帮助信息

选项:
    --domain    - 指定域名
    --email     - 指定邮箱（用于 SSL 证书）

示例:
    ./deploy.sh install --domain example.com --email admin@example.com
    ./deploy.sh update
    ./deploy.sh backup

EOF
}

# 检查系统要求
check_requirements() {
    log "检查系统要求..."
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        error "不支持的操作系统"
    fi
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        warning "Docker 未安装，正在安装..."
        install_docker
    else
        log "Docker 已安装: $(docker --version)"
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        warning "Docker Compose 未安装，正在安装..."
        install_docker_compose
    else
        log "Docker Compose 已安装: $(docker-compose --version)"
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        warning "Git 未安装，正在安装..."
        sudo apt-get update && sudo apt-get install -y git
    fi
    
    # 检查端口
    for port in 80 443 8097; do
        if lsof -i:$port &> /dev/null; then
            error "端口 $port 已被占用"
        fi
    done
    
    log "系统要求检查完成"
}

# 安装 Docker
install_docker() {
    log "开始安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log "Docker 安装完成"
}

# 安装 Docker Compose
install_docker_compose() {
    log "开始安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "Docker Compose 安装完成"
}

# 创建目录结构
create_directories() {
    log "创建目录结构..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$PROJECT_DIR/files"
    sudo mkdir -p "$PROJECT_DIR/logs"
    sudo mkdir -p "$PROJECT_DIR/aispeak-frontend/ssl"
    
    # 设置权限
    sudo chown -R $USER:$USER "$PROJECT_DIR"
    sudo chmod -R 755 "$PROJECT_DIR"
    log "目录创建完成"
}

# 克隆或更新代码
clone_or_update_code() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log "更新代码..."
        cd "$PROJECT_DIR"
        git stash
        git pull origin main
        git stash pop || true
    else
        log "克隆代码..."
        git clone https://github.com/your-repo/ai-speak.git "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
}

# 配置环境变量
configure_env() {
    log "配置环境变量..."
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        else
            error "找不到 .env.example 文件"
        fi
    fi
    
    # 生成安全的密钥
    if grep -q "your-secret-key" "$PROJECT_DIR/.env"; then
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/your-secret-key-at-least-32-characters/$SECRET_KEY/g" "$PROJECT_DIR/.env"
        log "已生成新的安全密钥"
    fi
    
    # 配置域名
    if [ -n "$DOMAIN" ]; then
        sed -i "s/your-domain.com/$DOMAIN/g" "$PROJECT_DIR/.env"
        sed -i "s/your-domain.com/$DOMAIN/g" "$PROJECT_DIR/aispeak-frontend/src/config/index.ts"
        
        # 更新 nginx 配置中的域名和证书路径
        sed -i "s/dingguagua.fun/$DOMAIN/g" "$PROJECT_DIR/aispeak-frontend/nginx.conf"
        sed -i "s|ssl_certificate /etc/nginx/ssl/.*\.crt|ssl_certificate /etc/nginx/ssl/$DOMAIN.crt|g" "$PROJECT_DIR/aispeak-frontend/nginx.conf"
        sed -i "s|ssl_certificate_key /etc/nginx/ssl/.*\.key|ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key|g" "$PROJECT_DIR/aispeak-frontend/nginx.conf"
        
        # 同时更新 docker-compose.yml 中的证书挂载路径
        sed -i "s|dingguagua.fun.crt|$DOMAIN.crt|g" "$PROJECT_DIR/docker-compose.yml"
        sed -i "s|dingguagua.fun.key|$DOMAIN.key|g" "$PROJECT_DIR/docker-compose.yml"
        
        log "域名配置完成: $DOMAIN"
    fi
    
    warning "请编辑 .env 文件，填入必要的配置信息"
    read -p "配置完成后按 Enter 继续..."
}

# 配置 SSL
configure_ssl() {
    log "配置 SSL 证书..."
    
    if [ -z "$DOMAIN" ]; then
        read -p "请输入域名: " DOMAIN
    fi
    
    SSL_DIR="$PROJECT_DIR/aispeak-frontend/ssl"
    mkdir -p "$SSL_DIR"
    
    # 检查是否已存在证书
    EXISTING_CERT=false
    if [ -f "$SSL_DIR/$DOMAIN.crt" ] && [ -f "$SSL_DIR/$DOMAIN.key" ]; then
        log "检测到已存在的 SSL 证书文件"
        
        # 检查证书有效性
        if openssl x509 -checkend 86400 -noout -in "$SSL_DIR/$DOMAIN.crt" 2>/dev/null; then
            EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/$DOMAIN.crt" | cut -d= -f2)
            log "证书有效，过期时间: $EXPIRY_DATE"
            EXISTING_CERT=true
            
            read -p "是否使用现有证书？[Y/n] " USE_EXISTING
            if [[ ! "$USE_EXISTING" =~ ^[Nn]$ ]]; then
                log "使用现有 SSL 证书"
                return 0
            fi
        else
            warning "现有证书已过期或无效"
        fi
    fi
    
    # 检查其他可能的证书位置
    if [ -f "$SSL_DIR/dingguagua.fun.crt" ] && [ -f "$SSL_DIR/dingguagua.fun.key" ]; then
        log "发现默认证书文件 (dingguagua.fun)"
        read -p "是否使用这些证书文件？[y/N] " USE_DEFAULT
        if [[ "$USE_DEFAULT" =~ ^[Yy]$ ]]; then
            # 复制为目标域名
            cp "$SSL_DIR/dingguagua.fun.crt" "$SSL_DIR/$DOMAIN.crt"
            cp "$SSL_DIR/dingguagua.fun.key" "$SSL_DIR/$DOMAIN.key"
            log "已复制默认证书为 $DOMAIN 证书"
            return 0
        fi
    fi
    
    # 提供选择：使用 Let's Encrypt 或手动配置
    echo "请选择 SSL 证书配置方式:"
    echo "1. 使用 Let's Encrypt 自动申请（推荐）"
    echo "2. 使用已有证书文件"
    echo "3. 稍后手动配置"
    read -p "请选择 [1-3]: " SSL_CHOICE
    
    case $SSL_CHOICE in
        1)
            # 使用 Let's Encrypt
            if [ -z "$EMAIL" ]; then
                read -p "请输入邮箱（用于 Let's Encrypt）: " EMAIL
            fi
            
            # 安装 certbot（如果未安装）
            if ! command -v certbot &> /dev/null; then
                log "安装 Certbot..."
                sudo apt-get update
                sudo apt-get install -y certbot
            fi
            
            # 停止占用 80 端口的服务
            if docker-compose ps | grep -q "Up.*80"; then
                log "临时停止 Web 服务以申请证书..."
                docker-compose stop frontend
            fi
            
            # 申请证书
            log "申请 Let's Encrypt 证书..."
            if sudo certbot certonly --standalone -d "$DOMAIN" -m "$EMAIL" --agree-tos -n; then
                # 复制证书到项目目录
                sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
                sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
                sudo chown $USER:$USER "$SSL_DIR/"*
                log "SSL 证书申请成功"
                
                # 设置自动续期
                setup_ssl_renewal
            else
                error "证书申请失败"
            fi
            
            # 重启服务
            if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
                docker-compose start frontend
            fi
            ;;
            
        2)
            # 使用已有证书
            log "请将证书文件放置在以下位置:"
            info "证书文件: $SSL_DIR/$DOMAIN.crt"
            info "私钥文件: $SSL_DIR/$DOMAIN.key"
            
            read -p "证书文件是否已准备好？[y/N] " CERT_READY
            if [[ "$CERT_READY" =~ ^[Yy]$ ]]; then
                if [ -f "$SSL_DIR/$DOMAIN.crt" ] && [ -f "$SSL_DIR/$DOMAIN.key" ]; then
                    log "证书文件已就位"
                    chmod 644 "$SSL_DIR/$DOMAIN.crt"
                    chmod 600 "$SSL_DIR/$DOMAIN.key"
                else
                    error "未找到证书文件"
                fi
            else
                warning "请在部署完成后手动配置证书"
            fi
            ;;
            
        3)
            # 稍后配置
            warning "跳过 SSL 配置，请记得稍后配置证书"
            info "证书应放置在: $SSL_DIR/"
            info "证书文件命名: $DOMAIN.crt 和 $DOMAIN.key"
            ;;
            
        *)
            error "无效的选择"
            ;;
    esac
}

# 设置 SSL 自动续期
setup_ssl_renewal() {
    log "设置 SSL 证书自动续期..."
    
    # 创建续期脚本
    cat > "/etc/cron.daily/aispeak-ssl-renewal" << EOF
#!/bin/bash
# AISpeak SSL 证书自动续期脚本

# 续期证书
certbot renew --quiet --no-self-upgrade

# 如果续期成功，复制新证书
if [ \$? -eq 0 ]; then
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key
    chown $USER:$USER $SSL_DIR/*
    
    # 重启前端服务以使用新证书
    cd $PROJECT_DIR && docker-compose restart frontend
fi
EOF
    
    chmod +x /etc/cron.daily/aispeak-ssl-renewal
    log "自动续期已配置"
}

# 构建和启动服务
build_and_start() {
    log "构建 Docker 镜像..."
    cd "$PROJECT_DIR"
    docker-compose build
    
    log "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log "服务启动成功"
    else
        error "服务启动失败"
    fi
}

# 初始化数据库
init_database() {
    log "初始化数据库..."
    
    # 等待数据库就绪
    sleep 5
    
    # 运行数据库迁移
    docker-compose exec -T backend alembic upgrade head
    
    log "数据库初始化完成"
}

# 备份数据
backup_data() {
    log "开始备份数据..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # 备份文件
    cp -r "$PROJECT_DIR/files" "$BACKUP_PATH/"
    
    # 备份数据库
    if docker-compose exec -T backend mysqldump -h mysql -u root -p$DB_PASSWORD aispeak_db > "$BACKUP_PATH/database.sql"; then
        log "数据库备份成功"
    else
        warning "数据库备份失败"
    fi
    
    # 备份环境变量
    cp "$PROJECT_DIR/.env" "$BACKUP_PATH/"
    
    # 压缩备份
    cd "$BACKUP_DIR"
    tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
    rm -rf "backup_$TIMESTAMP"
    
    log "备份完成: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    # 清理旧备份（保留最近7天）
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
}

# 恢复数据
restore_data() {
    log "恢复数据..."
    
    # 列出可用备份
    echo "可用的备份:"
    ls -1 "$BACKUP_DIR"/backup_*.tar.gz | nl
    
    read -p "请选择要恢复的备份编号: " BACKUP_NUM
    BACKUP_FILE=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz | sed -n "${BACKUP_NUM}p")
    
    if [ -z "$BACKUP_FILE" ]; then
        error "无效的备份编号"
    fi
    
    # 解压备份
    cd "$BACKUP_DIR"
    tar -xzf "$BACKUP_FILE"
    BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)
    
    # 停止服务
    cd "$PROJECT_DIR"
    docker-compose down
    
    # 恢复文件
    rm -rf "$PROJECT_DIR/files"
    cp -r "$BACKUP_DIR/$BACKUP_NAME/files" "$PROJECT_DIR/"
    
    # 恢复数据库
    docker-compose up -d mysql
    sleep 10
    docker-compose exec -T mysql mysql -u root -p$DB_PASSWORD aispeak_db < "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    
    # 启动所有服务
    docker-compose up -d
    
    # 清理
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    log "数据恢复完成"
}

# 查看日志
view_logs() {
    echo "选择要查看的日志:"
    echo "1. 后端日志"
    echo "2. 前端日志"
    echo "3. 所有日志"
    read -p "请选择 (1-3): " choice
    
    cd "$PROJECT_DIR"
    case $choice in
        1)
            docker-compose logs -f backend
            ;;
        2)
            docker-compose logs -f frontend
            ;;
        3)
            docker-compose logs -f
            ;;
        *)
            error "无效的选择"
            ;;
    esac
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    # 检查容器状态
    if docker-compose ps | grep -q "Exit"; then
        error "有容器异常退出"
    fi
    
    # 检查 API 健康状态
    if curl -f http://localhost:8097/api/v1/health &> /dev/null; then
        log "API 服务正常"
    else
        error "API 服务异常"
    fi
    
    # 检查前端
    if curl -f http://localhost &> /dev/null; then
        log "前端服务正常"
    else
        error "前端服务异常"
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        warning "磁盘使用率超过 80%"
    fi
    
    log "健康检查完成"
}

# 主函数
main() {
    # 创建日志文件
    sudo mkdir -p $(dirname "$LOG_FILE")
    sudo touch "$LOG_FILE"
    sudo chmod 666 "$LOG_FILE"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            *)
                COMMAND="$1"
                shift
                ;;
        esac
    done
    
    # 执行命令
    case "$COMMAND" in
        install)
            log "开始安装 AISpeak..."
            check_requirements
            create_directories
            clone_or_update_code
            configure_env
            if [ -n "$DOMAIN" ]; then
                configure_ssl
            fi
            build_and_start
            init_database
            health_check
            log "AISpeak 安装完成！"
            info "访问地址: http://localhost 或 https://$DOMAIN"
            ;;
            
        update)
            log "开始更新 AISpeak..."
            cd "$PROJECT_DIR"
            backup_data
            docker-compose down
            clone_or_update_code
            build_and_start
            health_check
            log "AISpeak 更新完成！"
            ;;
            
        backup)
            backup_data
            ;;
            
        restore)
            restore_data
            ;;
            
        start)
            cd "$PROJECT_DIR"
            docker-compose up -d
            log "服务已启动"
            ;;
            
        stop)
            cd "$PROJECT_DIR"
            docker-compose down
            log "服务已停止"
            ;;
            
        restart)
            cd "$PROJECT_DIR"
            docker-compose restart
            log "服务已重启"
            ;;
            
        status)
            cd "$PROJECT_DIR"
            docker-compose ps
            health_check
            ;;
            
        logs)
            view_logs
            ;;
            
        ssl)
            configure_ssl
            ;;
            
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"