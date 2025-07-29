#!/bin/bash

# AISpeak 健康检查脚本
# 用于监控服务状态和系统资源

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
API_URL="${API_URL:-http://localhost:8097/api/v1/health}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=85

# 结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0

# 输出函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

check_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((TOTAL_CHECKS++))
    ((PASSED_CHECKS++))
}

check_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((TOTAL_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

# Docker 服务检查
check_docker_services() {
    print_header "Docker 服务状态检查"
    
    # 检查 Docker 服务
    if systemctl is-active --quiet docker; then
        check_pass "Docker 服务运行正常"
    else
        check_fail "Docker 服务未运行"
        return 1
    fi
    
    # 检查容器状态
    cd /opt/ai-speak 2>/dev/null || {
        check_fail "项目目录不存在: /opt/ai-speak"
        return 1
    }
    
    # 后端容器
    if docker-compose ps | grep -q "aispeak_backend.*Up"; then
        check_pass "后端容器运行正常"
    else
        check_fail "后端容器未运行或异常"
    fi
    
    # 前端容器
    if docker-compose ps | grep -q "aispeak_frontend.*Up"; then
        check_pass "前端容器运行正常"
    else
        check_fail "前端容器未运行或异常"
    fi
}

# API 健康检查
check_api_health() {
    print_header "API 健康状态检查"
    
    # 基础健康检查
    if curl -sf "$API_URL" > /dev/null; then
        check_pass "API 健康检查端点响应正常"
        
        # 检查响应时间
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL")
        if (( $(echo "$RESPONSE_TIME < 1" | bc -l) )); then
            check_pass "API 响应时间正常: ${RESPONSE_TIME}s"
        else
            check_warn "API 响应时间较慢: ${RESPONSE_TIME}s"
        fi
    else
        check_fail "API 健康检查失败"
    fi
    
    # 检查数据库连接
    if docker-compose exec -T backend python -c "
from app.db import get_db
try:
    db = next(get_db())
    db.execute('SELECT 1')
    print('OK')
except:
    print('FAIL')
" 2>/dev/null | grep -q "OK"; then
        check_pass "数据库连接正常"
    else
        check_fail "数据库连接失败"
    fi
}

# 前端检查
check_frontend() {
    print_header "前端服务检查"
    
    # HTTP 检查
    if curl -sf "$FRONTEND_URL" > /dev/null; then
        check_pass "前端 HTTP 服务正常"
    else
        check_fail "前端 HTTP 服务异常"
    fi
    
    # HTTPS 检查（如果配置了）
    if curl -sf "https://localhost" --insecure > /dev/null 2>&1; then
        check_pass "前端 HTTPS 服务正常"
    else
        check_warn "HTTPS 未配置或异常"
    fi
    
    # 检查静态资源
    if curl -sf "$FRONTEND_URL/static/js/app.js" > /dev/null 2>&1; then
        check_pass "静态资源加载正常"
    else
        check_warn "静态资源可能有问题"
    fi
}

# 系统资源检查
check_system_resources() {
    print_header "系统资源检查"
    
    # CPU 使用率
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print int($2)}')
    if [ "$CPU_USAGE" -lt "$THRESHOLD_CPU" ]; then
        check_pass "CPU 使用率: ${CPU_USAGE}%"
    else
        check_warn "CPU 使用率过高: ${CPU_USAGE}%"
    fi
    
    # 内存使用率
    MEMORY_USAGE=$(free | awk '/Mem:/ {printf("%d", $3/$2 * 100)}')
    if [ "$MEMORY_USAGE" -lt "$THRESHOLD_MEMORY" ]; then
        check_pass "内存使用率: ${MEMORY_USAGE}%"
    else
        check_warn "内存使用率过高: ${MEMORY_USAGE}%"
    fi
    
    # 磁盘使用率
    DISK_USAGE=$(df -h /opt | awk 'NR==2 {print int($5)}')
    if [ "$DISK_USAGE" -lt "$THRESHOLD_DISK" ]; then
        check_pass "磁盘使用率: ${DISK_USAGE}%"
    else
        check_warn "磁盘使用率过高: ${DISK_USAGE}%"
    fi
    
    # Docker 磁盘使用
    DOCKER_DISK=$(docker system df --format "table {{.Type}}\t{{.Size}}" | grep -E "Images|Containers|Volumes" | awk '{sum += $2} END {print sum}')
    check_pass "Docker 磁盘使用: ${DOCKER_DISK:-0} GB"
}

# 日志检查
check_logs() {
    print_header "日志错误检查"
    
    # 检查最近的错误日志
    ERROR_COUNT=$(docker-compose logs --tail=1000 | grep -iE "error|exception|critical" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        check_pass "最近1000行日志无错误"
    elif [ "$ERROR_COUNT" -lt 10 ]; then
        check_warn "发现 $ERROR_COUNT 个错误日志"
    else
        check_fail "发现大量错误日志: $ERROR_COUNT"
    fi
    
    # 检查日志文件大小
    LOG_SIZE=$(du -sh /opt/ai-speak/logs 2>/dev/null | awk '{print $1}' || echo "0")
    check_pass "日志目录大小: $LOG_SIZE"
}

# 安全检查
check_security() {
    print_header "安全检查"
    
    # 检查防火墙
    if systemctl is-active --quiet ufw; then
        check_pass "防火墙已启用"
    else
        check_warn "防火墙未启用"
    fi
    
    # 检查 SSL 证书
    if [ -f /opt/ai-speak/aispeak-frontend/ssl/*.crt ]; then
        # 检查证书过期时间
        CERT_FILE=$(ls /opt/ai-speak/aispeak-frontend/ssl/*.crt | head -1)
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ "$DAYS_LEFT" -gt 30 ]; then
            check_pass "SSL 证书有效期: ${DAYS_LEFT} 天"
        elif [ "$DAYS_LEFT" -gt 7 ]; then
            check_warn "SSL 证书即将过期: ${DAYS_LEFT} 天"
        else
            check_fail "SSL 证书即将过期: ${DAYS_LEFT} 天"
        fi
    else
        check_warn "未配置 SSL 证书"
    fi
    
    # 检查文件权限
    if [ -f /opt/ai-speak/.env ]; then
        ENV_PERMS=$(stat -c %a /opt/ai-speak/.env)
        if [ "$ENV_PERMS" = "600" ] || [ "$ENV_PERMS" = "640" ]; then
            check_pass ".env 文件权限正确: $ENV_PERMS"
        else
            check_warn ".env 文件权限过于宽松: $ENV_PERMS"
        fi
    fi
}

# 备份检查
check_backups() {
    print_header "备份状态检查"
    
    BACKUP_DIR="/opt/backups/aispeak"
    if [ -d "$BACKUP_DIR" ]; then
        # 最新备份
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))
            if [ "$BACKUP_AGE" -lt 24 ]; then
                check_pass "最新备份: ${BACKUP_AGE} 小时前"
            else
                check_warn "最新备份: ${BACKUP_AGE} 小时前"
            fi
            
            # 备份数量
            BACKUP_COUNT=$(ls "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
            check_pass "备份文件数量: $BACKUP_COUNT"
        else
            check_fail "没有找到备份文件"
        fi
    else
        check_fail "备份目录不存在"
    fi
}

# 性能检查
check_performance() {
    print_header "性能指标检查"
    
    # 容器资源使用
    echo -e "\n容器资源使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "aispeak|CONTAINER"
    
    # 数据库连接数
    if DB_CONN=$(docker-compose exec -T backend python -c "
from app.db import engine
print(engine.pool.size())
" 2>/dev/null); then
        check_pass "数据库连接池大小: $DB_CONN"
    fi
}

# 生成报告
generate_report() {
    print_header "健康检查报告"
    
    SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    echo -e "\n总检查项: $TOTAL_CHECKS"
    echo -e "通过项: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "警告项: ${YELLOW}$WARNINGS${NC}"
    echo -e "失败项: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"
    echo -e "\n健康评分: ${GREEN}${SCORE}%${NC}"
    
    if [ "$SCORE" -ge 90 ]; then
        echo -e "\n状态: ${GREEN}系统运行良好${NC}"
    elif [ "$SCORE" -ge 70 ]; then
        echo -e "\n状态: ${YELLOW}系统需要关注${NC}"
    else
        echo -e "\n状态: ${RED}系统存在问题${NC}"
    fi
    
    # 保存报告
    REPORT_FILE="/var/log/aispeak-health-$(date +%Y%m%d-%H%M%S).log"
    {
        echo "AISpeak 健康检查报告"
        echo "时间: $(date)"
        echo "评分: ${SCORE}%"
        echo "检查项: $TOTAL_CHECKS"
        echo "通过: $PASSED_CHECKS"
        echo "警告: $WARNINGS"
    } > "$REPORT_FILE"
    
    echo -e "\n报告已保存至: $REPORT_FILE"
}

# 发送告警（可选）
send_alert() {
    if [ "$SCORE" -lt 70 ]; then
        # 这里可以添加发送邮件或通知的代码
        echo -e "\n${RED}[告警] 系统健康评分低于70%${NC}"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}AISpeak 健康检查工具${NC}"
    echo -e "开始时间: $(date)\n"
    
    # 执行各项检查
    check_docker_services
    check_api_health
    check_frontend
    check_system_resources
    check_logs
    check_security
    check_backups
    check_performance
    
    # 生成报告
    generate_report
    
    # 发送告警（如果需要）
    send_alert
    
    # 返回状态码
    if [ "$SCORE" -lt 60 ]; then
        exit 1
    fi
}

# 处理参数
case "${1:-}" in
    --json)
        # JSON 输出模式（用于监控系统集成）
        echo "{\"score\": $SCORE, \"total\": $TOTAL_CHECKS, \"passed\": $PASSED_CHECKS, \"warnings\": $WARNINGS}"
        ;;
    --quiet)
        # 静默模式，只输出评分
        main > /dev/null 2>&1
        echo "$SCORE"
        ;;
    *)
        # 默认模式
        main
        ;;
esac