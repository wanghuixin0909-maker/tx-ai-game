from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    npc_id: str = Field(..., description="NPC identifier such as nova or shade.")
    player_message: str = Field(..., description="The player's latest message.")

    @field_validator("npc_id", "player_message")
    @classmethod
    def strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty")
        return stripped


class ChatResponse(BaseModel):
    npc_id: str
    reply: str


class TokenStatsResponse(BaseModel):
    """Token 使用统计响应"""
    date: str = Field(..., description="统计日期")
    request_count: int = Field(default=0, description="请求次数")
    total_tokens: int = Field(default=0, description="总 token 数")
    prompt_tokens: int = Field(default=0, description="提示词 token 数")
    completion_tokens: int = Field(default=0, description="回复 token 数")
    avg_response_time_ms: float = Field(default=0.0, description="平均响应时间（毫秒）")

