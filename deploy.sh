#!/bin/bash
# =============================================================================
# Neon Echo - 生产环境部署脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查必要文件
check_files() {
    log_info "检查配置文件..."
    
    if [ ! -f "backend/.env.production" ]; then
        if [ -f "backend/.env.production.example" ]; then
            cp backend/.env.production.example backend/.env.production
            log_warn "已创建 .env.production，请编辑填写实际配置"
        else
            log_error "缺少 backend/.env.production 配置文件"
        fi
    fi
}

# 生成 SSL 证书（自签名，用于测试）
generate_self_signed_cert() {
    log_info "生成自签名 SSL 证书（测试用）..."
    mkdir -p nginx/ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=NeonEcho/CN=localhost"
    
    log_info "自签名证书已生成（仅用于本地测试）"
}

# 使用 Let's Encrypt 证书（生产环境）
setup_letsencrypt() {
    local DOMAIN=$1
    log_info "申请 Let's Encrypt 证书 for $DOMAIN..."
    
    # 创建证书目录
    mkdir -p /var/www/certbot
    
    # 使用 certbot 申请证书
    certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --agree-tos --email "admin@$DOMAIN" \
        --non-interactive --expand \
        --key-type rsa:4096
    
    # 复制证书到 nginx 配置目录
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" nginx/ssl/
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" nginx/ssl/
    
    log_info "Let's Encrypt 证书已配置"
}

# 构建 Docker 镜像
build_images() {
    log_info "构建 Docker 镜像..."
    docker-compose build --parallel
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose up -d
    docker-compose ps
}

# 查看日志
logs() {
    docker-compose logs -f "$@"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose down
}

# 清理
clean() {
    log_info "清理 Docker 资源..."
    docker-compose down -v --rmi local
    docker system prune -f
}

# 完整部署流程
deploy() {
    check_files
    generate_self_signed_cert
    build_images
    start_services
    log_info "部署完成！访问 https://localhost"
}

# 显示帮助
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  deploy          完整部署流程"
    echo "  build           构建 Docker 镜像"
    echo "  start           启动服务"
    echo "  stop            停止服务"
    echo "  restart         重启服务"
    echo "  logs [服务]     查看日志 (可选: frontend|backend|nginx)"
    echo "  clean           清理 Docker 资源"
    echo "  cert [域名]     申请 Let's Encrypt 证书"
    echo "  help            显示帮助"
}

# 主命令处理
case "${1:-help}" in
    deploy) deploy ;;
    build) check_files && build_images ;;
    start) start_services ;;
    stop) stop_services ;;
    restart) stop_services && start_services ;;
    logs) shift; logs "$@" ;;
    clean) clean ;;
    cert) setup_letsencrypt "$2" ;;
    help|--help|-h) show_help ;;
    *) log_error "未知命令: $1" ;;
esac
