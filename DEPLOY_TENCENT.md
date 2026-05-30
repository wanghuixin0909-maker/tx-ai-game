# 腾讯云同域名部署指南

这套方案对应你现在确定的目标:

- 前后端都放到腾讯云体系
- 前端和后端走同一个域名
- 前端请求 `/api`
- Nginx 负责把 `/api` 反代到 FastAPI
- 默认不开在线 AI, 避免额外扣费

这也是最适合解决“手机端和其他平台不挂梯子也能打开”的部署方式, 因为整条访问链路都可以留在腾讯云国内可访问节点内, 不再依赖 `Vercel` 或 `Render` 这类海外服务。

## 当前仓库已经具备的基础

- 前端线上环境默认走同源 `/api`: [src/lib/chatApi.ts](C:/Users/wanghuixin/Documents/New project 2/src/lib/chatApi.ts)
- 本地开发已支持 Vite 代理 `/api`: [vite.config.ts](C:/Users/wanghuixin/Documents/New project 2/vite.config.ts)
- 后端支持 `APP_MODE=demo`, 可以完全不调用在线模型: [backend/app/main.py](C:/Users/wanghuixin/Documents/New project 2/backend/app/main.py)

## 推荐部署架构

```text
浏览器
  -> 你的域名
  -> 腾讯云 Lighthouse / CVM
  -> Nginx
     -> /      转发到前端静态站容器
     -> /api/  转发到 FastAPI 容器
```

如果你后面要接入 `EdgeOne` 或腾讯云负载均衡, 也可以把 HTTPS 终止放在云侧, 服务器内部继续跑 HTTP。

## 本次新增的腾讯云部署文件

- `docker-compose.tencent.yml`
  - 适合 HTTP 部署, 或 HTTPS 在 EdgeOne / CLB 终止
- `docker-compose.tencent.https.yml`
  - 适合直接在 Lighthouse / CVM 上跑 HTTPS
- `nginx/nginx.tencent.http.conf`
  - 同域名 HTTP 反代配置
- `nginx/nginx.tencent.https.conf`
  - 同域名 HTTPS 反代配置
- `backend/.env.tencent.example`
  - 腾讯云生产环境变量模板, 默认 `APP_MODE=demo`
- `deploy.tencent.sh`
  - 一键部署脚本

## 方案一: 最省心的腾讯云服务器部署

适用场景:

- 你想把整站直接跑在一台腾讯云 Lighthouse / CVM 上
- 你希望前后端同域名
- 你希望移动端、Windows、Mac 都直接能访问

### 1. 准备服务器

建议:

- 系统: Ubuntu 22.04 LTS
- 放行端口: `80`, `443`
- 域名解析: 把 `A` 记录指向腾讯云服务器公网 IP

### 2. 上传项目并登录服务器

把仓库放到服务器后, 进入项目目录。

### 3. 准备环境变量

执行:

```bash
cp backend/.env.tencent.example backend/.env.production
```

然后按你的实际域名修改 `backend/.env.production`:

```dotenv
APP_MODE=demo
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
SQLITE_DB_PATH=backend/data/npc_memory.sqlite3
LLM_TIMEOUT_SECONDS=45
NPC_MEMORY_TURNS=12
HUNYUAN_API_KEY=
```

说明:

- `APP_MODE=demo`
  - 默认最稳, 不调用在线 AI, 不会产生模型费用
- `HUNYUAN_API_KEY`
  - 留空时不会启用腾讯混元在线回复
- `SQLITE_DB_PATH=backend/data/npc_memory.sqlite3`
  - 会落在宿主机挂载目录里, 重建容器后数据还在

### 4. 安装 Docker

如果服务器还没装 Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 5. 启动服务

如果 HTTPS 由 EdgeOne / CLB 负责:

```bash
bash deploy.tencent.sh http
```

如果 HTTPS 直接由这台服务器负责:

1. 准备证书文件:
   - `nginx/ssl/fullchain.pem`
   - `nginx/ssl/privkey.pem`
2. 启动:

```bash
bash deploy.tencent.sh https
```

也可以不用脚本, 直接执行:

```bash
docker compose -f docker-compose.tencent.yml up -d --build
```

或:

```bash
docker compose -f docker-compose.tencent.https.yml up -d --build
```

### 6. 验证是否部署成功

先在服务器本机检查:

```bash
docker compose -f docker-compose.tencent.yml ps
curl http://127.0.0.1/health
curl http://127.0.0.1/api/health
```

公网验证:

```bash
curl http://your-domain.com/health
curl http://your-domain.com/api/health
```

如果是 HTTPS 版:

```bash
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

## 方案二: 腾讯云云侧 HTTPS, 服务器内部 HTTP

适用场景:

- 你后面要接 `EdgeOne Pages`, `EdgeOne`, 或腾讯云负载均衡
- 你希望 HTTPS 证书、加速、WAF 这些放在云层做

做法:

- 服务器内部使用 `docker-compose.tencent.yml`
- 云侧把你的域名流量转到这台服务器 `80` 端口
- 对外依然是 `https://your-domain.com`

这样移动端访问体验通常更稳, 也更容易做证书管理。

## 为什么这套方案能解决“不挂梯子打不开”

核心原因不是“前端代码写得不对”, 而是你之前的访问链路里用了海外节点。

只要满足下面这几个条件, 手机和多数平台就能直接访问:

- 域名解析到腾讯云可访问节点
- 前端静态资源不再走海外平台
- 后端 API 不再走海外平台
- 前端和后端使用同一个主域名
- `/api` 由 Nginx 同源转发

这样浏览器不会再遇到:

- 海外节点被拦截或超时
- 跨域配置复杂
- 国内手机网络偶发连不上海外 CDN

## AI 费用控制建议

如果你现在的重点是比赛演示和提交作品, 建议先保持:

```dotenv
APP_MODE=demo
HUNYUAN_API_KEY=
```

这表示:

- 网站可以正常打开
- 四个剧本都能演示
- 不会因为线上访问自动调用付费模型

后面如果你确认需要在线 AI 回复, 再改成:

```dotenv
APP_MODE=development
HUNYUAN_API_KEY=你的腾讯混元密钥
```

## 常见问题

### 1. 网站能打开, 但聊天报错

优先检查:

- `backend/.env.production` 是否存在
- `APP_MODE` 是否写错
- `docker logs cyber-case-backend`

### 2. 主页能开, `/api/health` 返回 502

通常是后端容器没起来。检查:

```bash
docker compose -f docker-compose.tencent.yml logs backend
```

### 3. 手机上能打开首页, 但提交消息失败

这通常不是手机兼容性问题, 而是服务器接口没通。重点检查:

- 安全组是否放行
- Nginx 是否正常反代 `/api`
- 后端容器是否健康

### 4. 重新部署后 NPC 记忆丢了

腾讯云版 compose 已经把 `./backend/data` 挂载到容器内:

```text
./backend/data -> /app/backend/data
```

只要你不删除宿主机目录, SQLite 数据会保留。

## 交付时建议写法

如果你要给评委或老师说明部署策略, 可以直接写:

> 本项目已调整为腾讯云同域名部署方案: 前端静态页面与后端 API 均部署在腾讯云服务器, 由 Nginx 统一反向代理, 前端通过 `/api` 访问后端。该方案避免了海外节点依赖, 可显著提升国内移动端和其他平台的访问稳定性。
