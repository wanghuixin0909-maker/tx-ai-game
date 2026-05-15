from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .case_bible import get_memory_npc_id
from .demo_engine import get_demo_engine
from .llm import LlmConfigurationError, LlmTimeoutError, LlmUpstreamError, chat as chat_with_llm
from .memory import MemoryStoreError, memory_store
from .npc_prompts import get_npc_system_prompt
from .schemas import ChatRequest, ChatResponse, TokenStatsResponse
from .settings import get_settings
from .token_logger import get_token_logger


app = FastAPI(
    title="Cyber Case Chat API",
    version="0.1.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


def detect_player_attitude(message: str) -> str:
    """
    检测玩家消息的态度倾向，用于帮助 NPC 调整回复策略。
    返回态度标签：friendly / neutral / questioning / aggressive / pleading
    """
    # 威胁/施压关键词
    aggressive_keywords = [
        "证据", "证明", "抓到你", "凶手", "坦白", "交代", "说谎", "假的",
        "我知道", "你骗我", "别装了", "承认", "指认", "你是凶手",
        "我要", "必须", "一定", "肯定", "绝对", "毫无疑问",
    ]

    # 质疑/追问关键词
    questioning_keywords = [
        "为什么", "怎么", "什么", "谁", "何时", "哪里",
        "什么意思", "解释", "说清楚", "详细", "具体",
        "真的吗", "不确定", "怀疑", "可疑",
    ]

    # 友好/合作关键词
    friendly_keywords = [
        "帮忙", "帮助", "合作", "相信", "理解", "谢谢",
        "能否", "可以", "愿意", "希望", "请求", "请",
    ]

    # 示弱/求助关键词
    pleading_keywords = [
        "求", "拜托", "求你", "需要知道", "必须找出",
        "只有你能", "只有你", "关键", "重要", "生死",
    ]

    message_lower = message.lower()
    scores = {
        "aggressive": sum(1 for kw in aggressive_keywords if kw in message_lower),
        "questioning": sum(1 for kw in questioning_keywords if kw in message_lower),
        "friendly": sum(1 for kw in friendly_keywords if kw in message_lower),
        "pleading": sum(1 for kw in pleading_keywords if kw in message_lower),
    }

    # 优先检测强态度
    if scores["aggressive"] >= 2:
        return "aggressive"
    elif scores["pleading"] >= 2:
        return "pleading"
    elif scores["questioning"] >= 2:
        return "questioning"
    elif scores["friendly"] >= 2:
        return "friendly"
    elif scores["aggressive"] >= 1:
        return "questioning"  # 降级处理
    else:
        return "neutral"


@app.post("/chat", response_model=ChatResponse)
async def chat_route(payload: ChatRequest) -> ChatResponse:
    """主对话路由 - 根据 APP_MODE 自动切换开发/演示模式"""
    memory_npc_id = get_memory_npc_id(payload.npc_id)

    # 演示模式：不调用 API，直接返回本地数据
    if settings.app_mode == "demo":
        return await _demo_chat_route(payload, memory_npc_id)

    # 开发模式：正常调用 LLM API
    return await _dev_chat_route(payload, memory_npc_id)


async def _demo_chat_route(payload: ChatRequest, memory_npc_id: str) -> ChatResponse:
    """
    演示模式路由
    - 不调用任何外部 API
    - 从本地对话数据返回稳定回复
    """
    # 获取对话历史（用于假记忆系统）
    history = memory_store.load_history(memory_npc_id)
    conversation_history = [
        {"role": "user", "content": ex.player_message}
        for ex in history
    ] if history else None

    # 获取演示引擎回复
    demo_engine = get_demo_engine()
    result = demo_engine.get_reply(
        npc_id=payload.npc_id,
        player_message=payload.player_message,
        conversation_history=conversation_history,
    )

    reply = result.get("reply", "抱歉，演示模式出现错误。")

    # 在演示模式下，仍保存对话历史以维持假记忆
    try:
        memory_store.save_exchange(memory_npc_id, payload.player_message, reply)
    except MemoryStoreError:
        pass  # 记忆保存失败不影响回复

    return ChatResponse(
        npc_id=payload.npc_id,
        reply=reply,
    )


async def _dev_chat_route(payload: ChatRequest, memory_npc_id: str) -> ChatResponse:
    """
    开发模式路由
    - 正常调用腾讯混元 API
    - 记录 token 使用
    """
    system_prompt = get_npc_system_prompt(payload.npc_id)
    if system_prompt is None:
        raise HTTPException(status_code=400, detail="Unknown npc_id.")

    try:
        history = memory_store.load_history(memory_npc_id)
        recent_history = history[-settings.npc_memory_turns :]
        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        for exchange in recent_history:
            messages.append({"role": "user", "content": exchange.player_message})
            messages.append({"role": "assistant", "content": exchange.npc_reply})
        messages.append({"role": "user", "content": payload.player_message})

        reply = await chat_with_llm(messages, settings=settings)
        memory_store.save_exchange(memory_npc_id, payload.player_message, reply)

        # 记录 token 使用（估算值）
        token_logger = get_token_logger()
        estimated_prompt = sum(len(m["content"]) // 4 for m in messages)
        estimated_completion = len(reply) // 4
        token_logger.log_usage(
            npc_id=payload.npc_id,
            prompt_tokens=estimated_prompt,
            completion_tokens=estimated_completion,
            model=settings.model_candidates[0],
        )
    except MemoryStoreError as exc:
        raise HTTPException(status_code=500, detail="NPC memory service is unavailable.") from exc
    except LlmConfigurationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except LlmTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except LlmUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(npc_id=payload.npc_id, reply=reply)


@app.get("/mode")
async def get_app_mode() -> dict:
    """获取当前运行模式"""
    return {
        "mode": settings.app_mode,
        "description": "development" if settings.app_mode == "development" else "演示模式 - 不消耗 API Credits",
    }


@app.get("/health")
async def health_check() -> dict:
    """健康检查端点"""
    return {
        "status": "healthy",
        "mode": settings.app_mode,
    }


@app.get("/stats/token", response_model=TokenStatsResponse)
async def get_token_stats(days: int = 7) -> TokenStatsResponse:
    """
    获取 Token 使用统计

    Query Parameters:
        days: 统计天数，默认 7 天
    """
    token_logger = get_token_logger()
    stats = token_logger.get_daily_stats()
    # days 参数保留用于未来扩展（如按日期范围查询）

    return TokenStatsResponse(
        date=stats["date"],
        request_count=stats["request_count"],
        total_tokens=stats["total_tokens"],
        prompt_tokens=stats["total_prompt_tokens"],
        completion_tokens=stats["total_completion_tokens"],
        avg_response_time_ms=stats["avg_response_time_ms"],
    )


@app.post("/demo/reset")
async def reset_demo_state(npc_id: str | None = None) -> dict:
    """
    重置演示模式状态

    Query Parameters:
        npc_id: 可选，重置指定 NPC 的状态；不传则重置所有
    """
    if settings.app_mode != "demo":
        raise HTTPException(status_code=400, detail="仅演示模式下可用")

    demo_engine = get_demo_engine()
    demo_engine.reset_state(npc_id)

    return {
        "success": True,
        "message": f"已重置 {'所有' if npc_id is None else npc_id} 的演示状态",
    }


def _get_attitude_hint(attitude: str) -> str:
    """根据态度标签返回对应的提示"""
    hints = {
        "friendly": "友好合作。玩家愿意配合，可以适当主动透露信息。",
        "neutral": "中性询问。保持正常节奏。",
        "questioning": "质疑追问。玩家在深入追问某个点，要提高防备。",
        "aggressive": "施压威胁。玩家在逼问或威胁你，可以表现出情绪波动或更强硬的防守。",
        "pleading": "示弱求助。玩家表现出需要帮助，可以适当降低戒心。",
    }
    return hints.get(attitude, "中性询问。保持正常节奏。")
