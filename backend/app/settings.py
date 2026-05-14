from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"
HUNYUAN_PRIMARY_MODEL = "hunyuan-turbos-latest"
HUNYUAN_FALLBACK_MODEL = "hunyuan-standard"
DEFAULT_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
DEFAULT_SQLITE_DB_PATH = BASE_DIR / "data" / "npc_memory.sqlite3"


class Settings(BaseSettings):
    hunyuan_api_key: str = Field(default="", validation_alias="HUNYUAN_API_KEY")
    frontend_url: str = Field(default="", validation_alias="FRONTEND_URL")
    allowed_origins_raw: str = Field(
        default="",
        validation_alias="ALLOWED_ORIGINS",
    )
    sqlite_db_path: Path = Field(
        default=DEFAULT_SQLITE_DB_PATH,
        validation_alias="SQLITE_DB_PATH",
    )
    llm_timeout_seconds: float = Field(
        default=45.0,
        validation_alias="LLM_TIMEOUT_SECONDS",
    )
    npc_memory_turns: int = Field(default=12, validation_alias="NPC_MEMORY_TURNS")

    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        candidates: list[str] = []

        if self.allowed_origins_raw.strip():
            candidates.extend(
                origin.strip()
                for origin in self.allowed_origins_raw.split(",")
                if origin.strip()
            )

        if self.frontend_url.strip():
            candidates.append(self.frontend_url.strip())

        if not candidates:
            candidates = DEFAULT_ALLOWED_ORIGINS.copy()

        unique_origins: list[str] = []
        for origin in candidates:
            if origin not in unique_origins:
                unique_origins.append(origin)

        return unique_origins

    @property
    def resolved_sqlite_db_path(self) -> Path:
        db_path = self.sqlite_db_path.expanduser()
        if db_path.is_absolute():
            return db_path

        if db_path.parts and db_path.parts[0] == "backend":
            return (PROJECT_ROOT / db_path).resolve()

        return (BASE_DIR / db_path).resolve()

    @property
    def hunyuan_base_url(self) -> str:
        return HUNYUAN_BASE_URL

    @property
    def model_candidates(self) -> list[str]:
        return [HUNYUAN_PRIMARY_MODEL, HUNYUAN_FALLBACK_MODEL]


@lru_cache
def get_settings() -> Settings:
    return Settings()
