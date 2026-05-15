from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .case_bible import get_memory_npc_id
from .llm import LlmConfigurationError, LlmTimeoutError, LlmUpstreamError, chat as chat_with_llm
from .memory import MemoryStoreError, memory_store
from .npc_prompts import get_npc_system_prompt
from .schemas import ChatRequest, ChatResponse
from .settings import get_settings


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
    system_prompt = get_npc_system_prompt(payload.npc_id)
    if system_prompt is None:
        raise HTTPException(status_code=400, detail="Unknown npc_id.")

    memory_npc_id = get_memory_npc_id(payload.npc_id)

    # 检测玩家态度
    attitude = detect_player_attitude(payload.player_message)
    attitude_hint = _get_attitude_hint(attitude)

    try:
        history = memory_store.load_history(memory_npc_id)
        recent_history = history[-settings.npc_memory_turns :]

        # 构建带态度提示的系统提示词
        system_prompt_with_attitude = (
            f"{system_prompt}\n\n"
            f"【当前对话情境】玩家当前的态度是：{attitude_hint}\n"
            "请根据上述态度标签调整你的回复方式和情绪反应。"
        )

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt_with_attitude}]
        for exchange in recent_history:
            messages.append({"role": "user", "content": exchange.player_message})
            messages.append({"role": "assistant", "content": exchange.npc_reply})
        messages.append({"role": "user", "content": payload.player_message})

        reply = await chat_with_llm(messages, settings=settings)
        memory_store.save_exchange(memory_npc_id, payload.player_message, reply)
    except MemoryStoreError as exc:
        raise HTTPException(status_code=500, detail="NPC memory service is unavailable.") from exc
    except LlmConfigurationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except LlmTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except LlmUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(npc_id=payload.npc_id, reply=reply)


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
