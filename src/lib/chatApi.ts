const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const CHAT_REQUEST_TIMEOUT_MS = 60_000;

function isPrivateIpv4Host(hostname: string) {
  return /^(10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

function resolveDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000";
  }

  const { hostname, protocol } = window.location;
  const normalizedHostname = hostname.trim().toLowerCase();
  const isLoopbackHost =
    normalizedHostname === "localhost"
    || normalizedHostname === "127.0.0.1"
    || normalizedHostname === "::1"
    || normalizedHostname === "[::1]";

  if (isLoopbackHost || isPrivateIpv4Host(normalizedHostname)) {
    return `${protocol}//${hostname}:8000`;
  }

  // Public deployments should use a same-origin reverse proxy unless an
  // explicit backend domain is provided via VITE_API_BASE_URL.
  return "/api";
}

const defaultApiBaseUrl = resolveDefaultApiBaseUrl();
const activeApiBaseUrl = configuredApiBaseUrl || defaultApiBaseUrl;
const CHAT_API_URL = `${activeApiBaseUrl.replace(/\/+$/, "")}/chat`;

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

function buildConnectionErrorMessage() {
  if (configuredApiBaseUrl) {
    return "无法连接生产环境 API，请确认 VITE_API_BASE_URL 指向可公开访问的后端地址。";
  }

  if (defaultApiBaseUrl === "/api") {
    return "无法连接线上 API，请确认当前站点已配置 /api 反向代理，或在部署时设置 VITE_API_BASE_URL。";
  }

  return `无法连接后端服务，请确认 FastAPI 已启动并监听 ${defaultApiBaseUrl}。`;
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

    throw new ChatApiError(buildConnectionErrorMessage());
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
