# =============================================================================
# Neon Echo - 生产部署指南
# =============================================================================

## 目录
- [快速部署](#快速部署)
- [双模式 AI 架构](#双模式-ai-架构)
- [Docker 部署](#docker-部署)
- [前后端分离部署](#前后端分离部署)
- [HTTPS 配置](#https-配置)
- [环境变量配置](#环境变量配置)
- [Token 使用统计](#token-使用统计)
- [Cloud Studio 部署](#cloud-studio-部署)

---

## 快速部署

### 1. 配置环境变量
```bash
cp backend/.env.production.example backend/.env.production
# 编辑 backend/.env.production 填写实际配置
```

### 2. 启动服务
```bash
# 本地 Docker 部署
chmod +x deploy.sh
./deploy.sh deploy

# 或手动执行
docker-compose up -d
```

### 3. 访问
- 前端: `http://localhost`
- 后端 API: `http://localhost/api/chat`
- 健康检查: `http://localhost/health`

---

## 双模式 AI 架构

Neon Echo 支持两种运行模式，用于比赛演示阶段控制 API 消耗。

### 模式说明

| 模式 | 环境变量值 | 说明 | API 消耗 |
|------|------------|------|----------|
| 开发模式 | `development` | 调用腾讯混元 API，AI 回答自由发挥 | 有 |
| 演示模式 | `demo` | 本地 JSON 驱动，稳定剧情，无 API 调用 | **无** |

### 切换模式

```bash
# 编辑 .env 文件
APP_MODE=development   # 开发模式
APP_MODE=demo         # 演示模式
```

### 演示模式特性

- **关键词匹配**：根据玩家提问的关键词返回对应回复
- **人格一致性**：每个 NPC 有固定的说话风格和回应逻辑
- **假记忆系统**：记住对话历史，维持对话连贯性
- **线索推进**：通过追问解锁更多剧情分支
- **稳定剧情**：所有回复预定义，确保比赛演示顺利

### 演示模式对话数据

对话数据位于 `src/data/demo_dialogues.json`，包含：

- 4 个 NPC 的完整对话树
- 关键词匹配规则
- 剧情分支逻辑
- 假记忆模板

### 演示模式 API

```
GET  /mode          # 获取当前模式
POST /demo/reset    # 重置演示状态
```

---

## Docker 部署

### 构建镜像
```bash
# 构建所有服务
docker-compose build

# 构建特定服务
docker-compose build frontend
docker-compose build backend
```

### 启动/停止
```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
```

### 清理
```bash
# 停止并清理
docker-compose down -v

# 清理未使用的镜像
docker system prune -a
```

---

## 前后端分离部署

### 前端部署（Vercel）

1. 连接 GitHub 仓库
2. 配置环境变量:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   ```
3. 使用 `vercel.json` 或 `vercel.production.json` 配置

### 后端部署

**方案 A: Docker + 云服务器**

```bash
# 在服务器上
git clone your-repo
cd neon-echo
cp backend/.env.production.example backend/.env.production
vim backend/.env.production  # 填写配置
docker-compose up -d
```

**方案 B: Cloud Studio**

1. 在 Cloud Studio 中打开项目
2. 导入 `cloudstudio.yaml` 配置
3. 设置环境变量
4. 一键部署

---

## HTTPS 配置

### 方案一：Let's Encrypt（免费，推荐）

```bash
# 使用部署脚本
./deploy.sh cert your-domain.com

# 或手动配置
certbot certonly --nginx -d your-domain.com

# 证书会自动续期
```

### 方案二：自签名证书（仅测试用）

```bash
# 使用部署脚本生成测试证书
./deploy.sh

# 手动生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=NeonEcho/CN=your-domain.com"
```

### 方案三：云平台证书

- 腾讯云: 申请 SSL 证书，上传到 `nginx/ssl/`
- AWS ACM: 配置 Application Load Balancer
- 阿里云: SSL 证书服务

---

## 环境变量配置

### 后端环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `HUNYUAN_API_KEY` | ✅ | 腾讯混元 API 密钥 |
| `LLM_TIMEOUT_SECONDS` | ❌ | LLM 超时时间，默认 45 |
| `NPC_MEMORY_TURNS` | ❌ | NPC 记忆轮次，默认 12 |
| `ALLOWED_ORIGINS` | ✅ | 允许的源，用逗号分隔 |
| `APP_MODE` | ❌ | 运行模式：`development` 或 `demo` |

### 前端环境变量

| 变量名 | 说明 |
|--------|------|
| `VITE_API_BASE_URL` | 后端 API 地址 |

### 安全建议

1. **永远不要**将 `.env` 文件提交到版本控制
2. 生产环境使用 Docker Secrets 或云平台密钥管理
3. 定期轮换 API 密钥
4. 限制 `.env` 文件权限: `chmod 600 backend/.env`

---

## Token 使用统计

### 统计 API

```
GET /stats/token?days=7    # 获取 Token 使用统计
```

### 响应格式

```json
{
  "date": "2026-05-15",
  "request_count": 156,
  "total_tokens": 45230,
  "prompt_tokens": 32100,
  "completion_tokens": 13130,
  "avg_response_time_ms": 1250.5
}
```

### 数据库位置

Token 使用记录存储在 `backend/data/token_usage.sqlite3`

---

## Cloud Studio 部署

### 部署步骤

1. 登录 Cloud Studio
2. 导入项目或连接 Git
3. 配置环境变量:
   - `HUNYUAN_API_KEY`
   - `ALLOWED_ORIGINS`
4. 使用 Cloud Studio 内置 Docker 支持部署
5. 配置自定义域名（可选）

### Nginx 配置说明

- HTTP → HTTPS 重定向已配置
- API 请求代理到后端 `/api/*` → `/`
- WebSocket 支持已启用
- 静态资源缓存 1 年

---

## 架构图

```
                    ┌─────────────────────────────────────────┐
                    │              Cloudflare/CDN             │
                    │           (可选: SSL 终止)               │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │                 Nginx                  │
                    │         (反向代理 + SSL)                 │
                    │                                         │
                    │   ┌─────────────┐    ┌─────────────┐   │
                    │   │  Frontend   │    │   Backend   │   │
                    │   │  / -> :80   │    │  /api/*     │   │
                    │   └─────────────┘    │    -> :8000 │   │
                    │                      └─────────────┘   │
                    └─────────────────────────────────────────┘
```

---

## 故障排除

### 后端无法启动
```bash
# 检查日志
docker-compose logs backend

# 检查环境变量
docker-compose config
```

### 前端无法连接后端
```bash
# 检查网络
docker network ls
docker network inspect neon-echo_neon-echo-network

# 检查后端健康状态
curl http://localhost/health
```

### SSL 证书问题
```bash
# 检查证书
openssl s_client -connect your-domain.com:443

# 续期 Let's Encrypt
certbot renew
```

---

## 监控与日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f backend

# 实时资源使用
docker stats
```
