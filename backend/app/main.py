from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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


@app.post("/chat", response_model=ChatResponse)
async def chat_route(payload: ChatRequest) -> ChatResponse:
    system_prompt = get_npc_system_prompt(payload.npc_id)
    if system_prompt is None:
        raise HTTPException(status_code=400, detail="Unknown npc_id.")

    try:
        history = memory_store.load_history(payload.npc_id)
        recent_history = history[-settings.npc_memory_turns :]
        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        for exchange in recent_history:
            messages.append({"role": "user", "content": exchange.player_message})
            messages.append({"role": "assistant", "content": exchange.npc_reply})
        messages.append({"role": "user", "content": payload.player_message})

        reply = await chat_with_llm(messages, settings=settings)
        memory_store.save_exchange(payload.npc_id, payload.player_message, reply)
    except MemoryStoreError as exc:
        raise HTTPException(status_code=500, detail="NPC memory service is unavailable.") from exc
    except LlmConfigurationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except LlmTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except LlmUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(npc_id=payload.npc_id, reply=reply)
