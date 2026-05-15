# 双模式 AI 架构使用指南

## 概述

Neon Echo 支持**开发模式**和**演示模式**两种运行方式，适用于不同的使用场景。

| 模式 | 用途 | API 消耗 | 适用场景 |
|------|------|----------|----------|
| `development` | 正常开发调试 | 有 | 日常开发、功能迭代 |
| `demo` | 比赛演示 | **无** | 比赛现场、展会演示 |

---

## 快速切换

### 方式一：环境变量

```bash
# 演示模式
echo "APP_MODE=demo" >> backend/.env

# 开发模式
echo "APP_MODE=development" >> backend/.env
```

### 方式二：临时切换

```bash
APP_MODE=demo uvicorn backend.app.main:app --reload
```

### 方式三：API 查看当前模式

```
GET /mode
```

返回：
```json
{
  "mode": "demo",
  "description": "演示模式 - 不消耗 API Credits"
}
```

---

## 演示模式特性

### 1. 关键词匹配回复

根据玩家提问的关键词，返回对应的预设回复。

**匹配规则**（优先级从高到低）：
- `cheng` → 关于死者的追问
- `evidence` → 关于证据的追问
- `iris` → 关于运维主管的追问
- `badge` → 关于门禁复制的追问
- `alarm` → 关于假警报的追问
- `route` → 关于巡逻改线的追问
- `signature` → 关于离线签名的追问

### 2. NPC 人格一致性

每个 NPC 有独特的说话风格：

| NPC | 风格 | 口头禅 |
|-----|------|--------|
| Nova | 技术克制型 | "门禁日志显示..." |
| Shade | 交易试探型 | "信息是要交换的..." |
| Echo | 机械数据型 | "日志显示...置信度..." |
| Iris | 防御权威型 | "你了解运维流程吗？" |

### 3. 假记忆系统

- 记录对话轮次，保持回复差异
- 根据玩家态度调整信任度
- 避免重复相同的回复

### 4. 线索推进控制

当玩家追问特定话题时，会逐步透露更多信息：

```
初始 → 基础事实
追问 → 间接线索
逼问 → 核心秘密
```

---

## 对话数据文件

`src/data/demo_dialogues.json` 结构：

```json
{
  "npcs": {
    "nova": {
      "personality": "理性克制",
      "initial_trust": 68,
      "responses": {
        "badge": ["回复1", "回复2"],
        "iris": ["回复1", "回复2"],
        "default": ["默认回复"]
      }
    }
  },
  "keyword_matching": {
    "badge": ["门禁", "复制", "刷卡"]
  },
  "fake_memory_templates": {
    "first_contact": {...},
    "suspicious": {...}
  }
}
```

---

## API 端点

### 聊天（自动识别模式）

```
POST /chat
{
  "npc_id": "nova",
  "player_message": "门禁复制是怎么回事？"
}
```

### 查看当前模式

```
GET /mode
```

### Token 统计

```
GET /stats/token
```

### 重置演示状态

```
POST /demo/reset?npc_id=nova
```

---

## 比赛演示建议

### 比赛前

1. 将 `APP_MODE=demo` 写入 `.env`
2. 测试所有 NPC 的对话流程
3. 确认剧情稳定无异常

### 比赛中

- 演示模式不消耗 API Credits
- 所有对话都是预设的稳定剧情
- 不用担心 AI "自由发挥" 破坏演示

### 比赛后

- 切回 `APP_MODE=development` 继续开发
- 使用 `/stats/token` 统计 API 消耗

---

## 自定义对话数据

### 添加新回复

在 `demo_dialogues.json` 中添加：

```json
"your_topic": [
  "回复内容1",
  "回复内容2"
]
```

### 添加关键词

```json
"keyword_matching": {
  "your_topic": ["关键词1", "关键词2", "keyword"]
}
```

### 修改 NPC 人格

编辑 `npcs.{npc_id}.personality` 和 `responses`

---

## 故障排除

### 演示模式不工作

1. 检查 `.env` 文件中 `APP_MODE=demo`
2. 重启后端服务
3. 访问 `/mode` 确认模式

### 回复不匹配

1. 检查关键词是否在 `keyword_matching` 中
2. 确认关键词拼写正确
3. 查看日志确认匹配逻辑

### 想切换回开发模式

```bash
# 编辑 .env
APP_MODE=development

# 重启服务
docker-compose restart backend
```
