const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8000";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const CHAT_API_URL = `${(configuredApiBaseUrl || DEFAULT_LOCAL_API_BASE_URL).replace(/\/+$/, "")}/chat`;
const CHAT_REQUEST_TIMEOUT_MS = 60_000;

interface ChatApiRequest {
  npcId: string;
  playerMessage: string;
}

interface ChatApiSuccessResponse {
  npc_id: string;
  reply: string;
}

interface ChatApiErrorResponse {
  detail?: string;
}

export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

export async function fetchNpcReply({
  npcId,
  playerMessage,
}: ChatApiRequest): Promise<ChatApiSuccessResponse> {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        npc_id: npcId,
        player_message: playerMessage,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ChatApiError("NPC 响应超时，请稍后重试。", 504);
    }

    throw new ChatApiError(
      configuredApiBaseUrl
        ? "无法连接后端服务，请确认生产环境 API 地址可访问。"
        : "无法连接后端服务，请确认 FastAPI 已启动并监听 http://127.0.0.1:8000。",
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as
    | ChatApiErrorResponse
    | ChatApiSuccessResponse
    | null;

  if (!response.ok) {
    const detail =
      payload && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : "请求 NPC 回复失败。";
    throw new ChatApiError(detail, response.status);
  }

  if (
    !payload ||
    !("npc_id" in payload) ||
    typeof payload.npc_id !== "string" ||
    !("reply" in payload) ||
    typeof payload.reply !== "string" ||
    !payload.reply.trim()
  ) {
    throw new ChatApiError("后端返回了无效的 NPC 回复。", response.status);
  }

  return payload;
}
