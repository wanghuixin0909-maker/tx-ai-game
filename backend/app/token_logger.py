"""
API Token 使用日志记录器
统计每次请求的 token 消耗和每日总消耗
"""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from threading import Lock
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = BASE_DIR / "data" / "token_usage.sqlite3"


@dataclass
class TokenUsageRecord:
    """Token 使用记录"""
    npc_id: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    request_time: str
    response_time_ms: int


class TokenUsageLogger:
    """
    Token 使用日志记录器
    - 记录每次 API 请求的 token 消耗
    - 统计每日总消耗
    - 存储到 SQLite 数据库
    """

    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self._lock = Lock()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path, timeout=30)

    def _initialize(self) -> None:
        """初始化数据库表"""
        with self._lock:
            with self._connect() as connection:
                connection.execute("PRAGMA journal_mode=WAL;")
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS token_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        npc_id TEXT NOT NULL,
                        prompt_tokens INTEGER NOT NULL DEFAULT 0,
                        completion_tokens INTEGER NOT NULL DEFAULT 0,
                        total_tokens INTEGER NOT NULL DEFAULT 0,
                        model TEXT NOT NULL,
                        request_time TEXT NOT NULL,
                        response_time_ms INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_token_usage_date
                    ON token_usage (request_time)
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_token_usage_npc
                    ON token_usage (npc_id)
                    """
                )

    def log_usage(
        self,
        npc_id: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        model: str = "unknown",
        response_time_ms: int = 0,
    ) -> None:
        """
        记录一次 API 调用

        Args:
            npc_id: NPC ID
            prompt_tokens: 提示词 token 数
            completion_tokens: 回复 token 数
            model: 使用的模型
            response_time_ms: 响应时间（毫秒）
        """
        total_tokens = prompt_tokens + completion_tokens
        request_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        created_at = datetime.now().isoformat(timespec="seconds")

        try:
            with self._lock:
                with self._connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO token_usage 
                        (npc_id, prompt_tokens, completion_tokens, total_tokens, model, request_time, response_time_ms, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (npc_id, prompt_tokens, completion_tokens, total_tokens, model, request_time, response_time_ms, created_at),
                    )
        except sqlite3.Error:
            pass  # 日志记录失败不影响主流程

    def get_daily_stats(self, target_date: Optional[date] = None) -> dict:
        """
        获取指定日期的统计信息

        Args:
            target_date: 目标日期，默认今天

        Returns:
            包含统计信息的字典
        """
        if target_date is None:
            target_date = date.today()

        date_str = target_date.strftime("%Y-%m-%d")

        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    SELECT 
                        COUNT(*) as request_count,
                        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
                        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
                        COALESCE(SUM(total_tokens), 0) as total_tokens,
                        COALESCE(AVG(response_time_ms), 0) as avg_response_time_ms,
                        COALESCE(AVG(total_tokens), 0) as avg_tokens_per_request
                    FROM token_usage
                    WHERE request_time LIKE ?
                    """,
                    (f"{date_str}%",),
                )
                row = cursor.fetchone()

                if row:
                    return {
                        "date": date_str,
                        "request_count": row[0],
                        "total_prompt_tokens": row[1],
                        "total_completion_tokens": row[2],
                        "total_tokens": row[3],
                        "avg_response_time_ms": round(row[4], 2),
                        "avg_tokens_per_request": round(row[5], 2),
                    }
        except sqlite3.Error:
            pass

        return {
            "date": date_str,
            "request_count": 0,
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "total_tokens": 0,
            "avg_response_time_ms": 0,
            "avg_tokens_per_request": 0,
        }

    def get_npc_stats(self, npc_id: str, days: int = 7) -> dict:
        """
        获取指定 NPC 的统计信息

        Args:
            npc_id: NPC ID
            days: 统计天数

        Returns:
            NPC 统计信息
        """
        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    SELECT 
                        COUNT(*) as request_count,
                        COALESCE(SUM(total_tokens), 0) as total_tokens,
                        COALESCE(AVG(total_tokens), 0) as avg_tokens,
                        MAX(request_time) as last_request
                    FROM token_usage
                    WHERE npc_id = ?
                    AND request_time >= datetime('now', '-' || ? || ' days')
                    """,
                    (npc_id, days),
                )
                row = cursor.fetchone()

                if row:
                    return {
                        "npc_id": npc_id,
                        "period_days": days,
                        "request_count": row[0],
                        "total_tokens": row[1],
                        "avg_tokens_per_request": round(row[2], 2) if row[2] else 0,
                        "last_request": row[3],
                    }
        except sqlite3.Error:
            pass

        return {
            "npc_id": npc_id,
            "period_days": days,
            "request_count": 0,
            "total_tokens": 0,
            "avg_tokens_per_request": 0,
            "last_request": None,
        }

    def get_all_stats(self, days: int = 30) -> dict:
        """
        获取全局统计信息

        Args:
            days: 统计天数

        Returns:
            全局统计信息
        """
        try:
            with self._connect() as connection:
                # 总览
                cursor = connection.execute(
                    """
                    SELECT 
                        COUNT(*) as total_requests,
                        COALESCE(SUM(total_tokens), 0) as total_tokens,
                        COALESCE(AVG(total_tokens), 0) as avg_tokens,
                        MIN(request_time) as first_request,
                        MAX(request_time) as last_request
                    FROM token_usage
                    WHERE request_time >= datetime('now', '-' || ? || ' days')
                    """,
                    (days,),
                )
                overview = cursor.fetchone()

                # 每日统计
                cursor = connection.execute(
                    """
                    SELECT 
                        DATE(request_time) as day,
                        COUNT(*) as requests,
                        COALESCE(SUM(total_tokens), 0) as tokens
                    FROM token_usage
                    WHERE request_time >= datetime('now', '-' || ? || ' days')
                    GROUP BY DATE(request_time)
                    ORDER BY day DESC
                    """,
                    (days,),
                )
                daily = cursor.fetchall()

                # NPC 分布
                cursor = connection.execute(
                    """
                    SELECT 
                        npc_id,
                        COUNT(*) as requests,
                        COALESCE(SUM(total_tokens), 0) as tokens
                    FROM token_usage
                    WHERE request_time >= datetime('now', '-' || ? || ' days')
                    GROUP BY npc_id
                    ORDER BY tokens DESC
                    """,
                    (days,),
                )
                npc_stats = cursor.fetchall()

                return {
                    "period_days": days,
                    "total_requests": overview[0] if overview else 0,
                    "total_tokens": overview[1] if overview else 0,
                    "avg_tokens_per_request": round(overview[2], 2) if overview and overview[2] else 0,
                    "first_request": overview[3] if overview else None,
                    "last_request": overview[4] if overview else None,
                    "daily_stats": [
                        {"date": str(r[0]), "requests": r[1], "tokens": r[2]}
                        for r in (daily or [])
                    ],
                    "npc_stats": [
                        {"npc_id": r[0], "requests": r[1], "tokens": r[2]}
                        for r in (npc_stats or [])
                    ],
                }
        except sqlite3.Error:
            pass

        return {
            "period_days": days,
            "total_requests": 0,
            "total_tokens": 0,
            "avg_tokens_per_request": 0,
            "daily_stats": [],
            "npc_stats": [],
        }

    def export_to_json(self, filepath: Path, days: int = 30) -> bool:
        """
        导出统计到 JSON 文件

        Args:
            filepath: 输出文件路径
            days: 统计天数

        Returns:
            是否成功
        """
        stats = self.get_all_stats(days)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            return True
        except (IOError, OSError):
            return False


# 全局单例
_token_logger: Optional[TokenUsageLogger] = None


def get_token_logger() -> TokenUsageLogger:
    """获取 Token 日志记录器单例"""
    global _token_logger
    if _token_logger is None:
        _token_logger = TokenUsageLogger()
    return _token_logger
