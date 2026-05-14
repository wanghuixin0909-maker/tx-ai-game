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

