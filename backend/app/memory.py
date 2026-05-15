from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from threading import Lock

from .settings import get_settings


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = get_settings().resolved_sqlite_db_path


class MemoryStoreError(RuntimeError):
    """Raised when the SQLite-backed memory store cannot be used."""


@dataclass(frozen=True)
class MemoryExchange:
    npc_id: str
    player_message: str
    npc_reply: str
    created_at: str


class NPCMemoryStore:
    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self._lock = Lock()

        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path, timeout=30)

    def _initialize(self) -> None:
        try:
            with self._lock:
                with self._connect() as connection:
                    connection.execute("PRAGMA journal_mode=WAL;")
                    connection.execute(
                        """
                        CREATE TABLE IF NOT EXISTS npc_memory (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            npc_id TEXT NOT NULL,
                            player_message TEXT NOT NULL,
                            npc_reply TEXT NOT NULL,
                            created_at TEXT NOT NULL
                        )
                        """,
                    )
                    connection.execute(
                        """
                        CREATE INDEX IF NOT EXISTS idx_npc_memory_npc_id_id
                        ON npc_memory (npc_id, id)
                        """,
                    )
        except sqlite3.Error as exc:
            raise MemoryStoreError("Failed to initialize NPC memory storage.") from exc

    def save_exchange(
        self,
        npc_id: str,
        player_message: str,
        npc_reply: str,
        created_at: str | None = None,
    ) -> None:
        timestamp = created_at or datetime.now().astimezone().isoformat(timespec="seconds")

        try:
            with self._lock:
                with self._connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO npc_memory (npc_id, player_message, npc_reply, created_at)
                        VALUES (?, ?, ?, ?)
                        """,
                        (npc_id, player_message, npc_reply, timestamp),
                    )
        except sqlite3.Error as exc:
            raise MemoryStoreError("Failed to save NPC memory.") from exc

    def load_history(self, npc_id: str) -> list[MemoryExchange]:
        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    SELECT npc_id, player_message, npc_reply, created_at
                    FROM npc_memory
                    WHERE npc_id = ?
                    ORDER BY id ASC
                    """,
                    (npc_id,),
                ).fetchall()
        except sqlite3.Error as exc:
            raise MemoryStoreError("Failed to load NPC memory.") from exc

        return [
            MemoryExchange(
                npc_id=row[0],
                player_message=row[1],
                npc_reply=row[2],
                created_at=row[3],
            )
            for row in rows
        ]

    def build_history_context(self, npc_id: str) -> str:
        history = self.load_history(npc_id)
        if not history:
            return ""

        lines: list[str] = []
        for exchange in history:
            lines.append(f"[{exchange.created_at}] 玩家: {exchange.player_message}")
            lines.append(f"[{exchange.created_at}] NPC: {exchange.npc_reply}")

        return "\n".join(lines)

    def augment_system_prompt(self, *, npc_id: str, system_prompt: str) -> str:
        history_context = self.build_history_context(npc_id)
        if not history_context:
            return system_prompt

        return (
            f"{system_prompt}\n\n"
            "【对话记忆｜必须遵守】\n"
            "以下是你和当前玩家已经发生过的历史对话。你必须：\n"
            "1. 保持之前说过的话的一致性，不要自相矛盾\n"
            "2. 如果之前回避了某个问题，现在也不能突然直接回答\n"
            "3. 可以补充之前没说的细节，但不能否认之前说过的事实\n"
            "4. 记住你对玩家的态度变化，并保持连贯\n"
            "5. 如果玩家提到了你之前说的话，可以承认或解释，但不能假装没说过\n\n"
            f"{history_context}\n\n"
            "【记忆检查清单】在回复前，请快速检查：\n"
            "- 我之前有没有说过与此矛盾的话？\n"
            "- 这个问题我之前是怎么回应的？\n"
            "- 玩家现在的态度和之前比有什么变化？"
        )

    def clear_memory(self, npc_id: str | None = None) -> int:
        try:
            with self._lock:
                with self._connect() as connection:
                    if npc_id is None:
                        cursor = connection.execute("DELETE FROM npc_memory")
                    else:
                        cursor = connection.execute(
                            "DELETE FROM npc_memory WHERE npc_id = ?",
                            (npc_id,),
                        )
        except sqlite3.Error as exc:
            raise MemoryStoreError("Failed to clear NPC memory.") from exc

        return max(cursor.rowcount, 0)


memory_store = NPCMemoryStore()
