from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


CASE_BIBLE_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "case-bible.json"


@lru_cache
def load_case_bible() -> dict[str, Any]:
    with CASE_BIBLE_PATH.open("r", encoding="utf-8") as case_bible_file:
        return json.load(case_bible_file)


def get_case_id() -> str:
    return str(load_case_bible()["case"]["id"])


def get_memory_npc_id(npc_id: str) -> str:
    return f"{get_case_id()}::{npc_id}"
