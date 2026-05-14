from __future__ import annotations

from typing import Any, Sequence

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI

from .settings import Settings, get_settings


class LlmClientError(Exception):
    """Base error for LLM client failures."""


class LlmConfigurationError(LlmClientError):
    """Raised when required local configuration is missing or invalid."""


class LlmTimeoutError(LlmClientError):
    """Raised when the upstream model request times out."""


class LlmUpstreamError(LlmClientError):
    """Raised when the upstream model returns an invalid or failing response."""


def _error_message(exc: BaseException) -> str:
    message = getattr(exc, "message", None)
    if isinstance(message, str) and message.strip():
        return message.strip()

    detail = str(exc).strip()
    return detail or "模型请求失败。"


def _should_fallback_model(exc: BaseException, model: str) -> bool:
    if not isinstance(exc, APIStatusError):
        return False

    if exc.status_code not in {400, 404, 422}:
        return False

    detail = _error_message(exc).lower()
    model_name = model.lower()
    fallback_markers = (
        "model",
        "not found",
        "not exist",
        "does not exist",
        "unsupported",
        "not support",
        "unavailable",
        "invalid",
    )

    if model_name not in detail and "model" not in detail:
        return False

    return any(marker in detail for marker in fallback_markers)


def _extract_reply_text(message: Any) -> str:
    content = getattr(message, "content", None)
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        fragments: list[str] = []
        for item in content:
            text = getattr(item, "text", None)
            if isinstance(text, str) and text.strip():
                fragments.append(text.strip())
                continue

            if isinstance(item, dict):
                dict_text = item.get("text")
                if isinstance(dict_text, str) and dict_text.strip():
                    fragments.append(dict_text.strip())
        return "\n".join(fragments).strip()

    return ""


def _normalize_messages(messages: Sequence[dict[str, str]]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for message in messages:
        role = message.get("role", "").strip()
        content = message.get("content", "").strip()
        if not role or not content:
            continue
        normalized.append({"role": role, "content": content})
    return normalized


async def _request_chat_completion(
    *,
    client: AsyncOpenAI,
    model: str,
    messages: list[dict[str, str]],
) -> str:
    completion = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=1,
        max_tokens=220,
    )

    if not completion.choices:
        raise LlmUpstreamError("腾讯混元未返回可用结果。")

    reply = _extract_reply_text(completion.choices[0].message)
    if not reply:
        raise LlmUpstreamError("腾讯混元返回了空内容。")

    return reply


async def chat(
    messages: Sequence[dict[str, str]],
    *,
    settings: Settings | None = None,
) -> str:
    resolved_settings = settings or get_settings()
    if not resolved_settings.hunyuan_api_key:
        raise LlmConfigurationError("HUNYUAN_API_KEY 未配置。")

    normalized_messages = _normalize_messages(messages)
    if not normalized_messages:
        raise LlmConfigurationError("未提供有效的对话消息。")

    client = AsyncOpenAI(
        api_key=resolved_settings.hunyuan_api_key,
        base_url=resolved_settings.hunyuan_base_url,
        timeout=resolved_settings.llm_timeout_seconds,
    )

    models = resolved_settings.model_candidates
    if not models:
        raise LlmConfigurationError("未配置可用的混元模型。")

    last_status_error: APIStatusError | None = None

    try:
        for index, model in enumerate(models):
            try:
                return await _request_chat_completion(
                    client=client,
                    model=model,
                    messages=normalized_messages,
                )
            except APITimeoutError as exc:
                raise LlmTimeoutError("腾讯混元请求超时，请稍后重试。") from exc
            except APIConnectionError as exc:
                raise LlmUpstreamError(
                    "无法连接腾讯混元，请检查网络和 API 配置。",
                ) from exc
            except APIStatusError as exc:
                last_status_error = exc
                if exc.status_code in {401, 403}:
                    raise LlmConfigurationError("HUNYUAN_API_KEY 无效或未配置。") from exc
                if exc.status_code == 429:
                    raise LlmUpstreamError("腾讯混元当前限流，请稍后重试。") from exc
                is_last_model = index == len(models) - 1
                if not is_last_model and _should_fallback_model(exc, model):
                    continue
                raise LlmUpstreamError(_error_message(exc)) from exc
    finally:
        await client.close()

    if last_status_error is not None:
        raise LlmUpstreamError(_error_message(last_status_error)) from last_status_error

    raise LlmUpstreamError("腾讯混元请求失败，请稍后重试。")
