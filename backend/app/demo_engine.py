"""
演示模式引擎 - Demo Engine
用于比赛演示阶段，不调用任何 API，直接从本地数据返回稳定回复
"""
from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]


@dataclass
class DemoNpcProfile:
    """演示模式 NPC 配置"""
    npc_id: str
    personality: str
    speaking_style: str
    initial_trust: int
    responses: dict[str, list[str]]
    fake_memory: dict[str, str]


@dataclass
class DemoEngineState:
    """演示引擎状态"""
    conversation_count: dict[str, int] = field(default_factory=dict)
    trust_levels: dict[str, int] = field(default_factory=dict)
    player_attitudes: dict[str, str] = field(default_factory=dict)
    answered_questions: dict[str, set[str]] = field(default_factory=dict)
    fake_memories: dict[str, list[str]] = field(default_factory=dict)


class DemoEngine:
    """
    演示模式对话引擎
    特点：
    - 关键词匹配回复
    - NPC 人格一致性
    - 假记忆系统
    - 线索推进控制
    - 玩家态度感知
    """

    def __init__(self, dialogues_path: Optional[Path] = None) -> None:
        self.dialogues_path = dialogues_path or (BASE_DIR / "src" / "data" / "demo_dialogues.json")
        self._dialogues: Optional[dict] = None
        self._npc_profiles: dict[str, DemoNpcProfile] = {}
        self._state = DemoEngineState()

    def _load_dialogues(self) -> dict:
        """加载对话数据"""
        if self._dialogues is None:
            with open(self.dialogues_path, "r", encoding="utf-8") as f:
                self._dialogues = json.load(f)
        return self._dialogues

    def _get_npc_profile(self, npc_id: str) -> Optional[DemoNpcProfile]:
        """获取 NPC 配置文件"""
        if npc_id in self._npc_profiles:
            return self._npc_profiles[npc_id]

        dialogues = self._load_dialogues()
        npc_data = dialogues.get("npcs", {}).get(npc_id)

        if not npc_data:
            return None

        profile = DemoNpcProfile(
            npc_id=npc_id,
            personality=npc_data.get("personality", ""),
            speaking_style=npc_data.get("speaking_style", ""),
            initial_trust=npc_data.get("initial_trust", 50),
            responses=npc_data.get("responses", {}),
            fake_memory=dialogues.get("fake_memory_templates", {}),
        )
        self._npc_profiles[npc_id] = profile
        return profile

    def _detect_keywords(self, message: str) -> list[str]:
        """检测消息中的关键词"""
        dialogues = self._load_dialogues()
        keyword_matching = dialogues.get("keyword_matching", {})
        message_lower = message.lower()
        found_keywords: list[str] = []

        for keyword, patterns in keyword_matching.items():
            for pattern in patterns:
                if pattern.lower() in message_lower:
                    if keyword not in found_keywords:
                        found_keywords.append(keyword)
                    break

        return found_keywords

    def _detect_attitude(self, message: str) -> str:
        """检测玩家态度"""
        aggressive_keywords = ["证据", "证明", "凶手", "坦白", "说谎", "你骗我", "承认", "指认"]
        questioning_keywords = ["为什么", "怎么", "什么", "谁", "如何", "解释"]
        friendly_keywords = ["帮忙", "合作", "相信", "感谢", "能否", "请"]

        message_lower = message.lower()
        scores = {
            "aggressive": sum(1 for kw in aggressive_keywords if kw in message_lower),
            "questioning": sum(1 for kw in questioning_keywords if kw in message_lower),
            "friendly": sum(1 for kw in friendly_keywords if kw in message_lower),
        }

        if scores["aggressive"] >= 2:
            return "aggressive"
        elif scores["friendly"] >= 2:
            return "friendly"
        elif scores["questioning"] >= 1:
            return "questioning"
        return "neutral"

    def _get_response_for_keywords(
        self,
        profile: DemoNpcProfile,
        keywords: list[str],
        npc_id: str,
    ) -> Optional[str]:
        """根据关键词获取回复"""
        # 优先匹配高优先级关键词
        priority_order = ["cheng", "evidence", "iris", "badge", "alarm", "route", "signature"]

        for keyword in priority_order:
            if keyword in keywords:
                responses = profile.responses.get(keyword, [])
                if responses:
                    # 获取该 NPC 当前的对话计数，用于选择不同回复
                    conv_count = self._state.conversation_count.get(npc_id, 0)
                    response_index = conv_count % len(responses)
                    return responses[response_index]

        # 如果没有匹配，返回默认回复
        default_responses = profile.responses.get("default", [])
        if default_responses:
            return random.choice(default_responses)

        return None

    def _update_state(
        self,
        npc_id: str,
        keywords: list[str],
        attitude: str,
    ) -> None:
        """更新引擎状态"""
        # 更新对话计数
        if npc_id not in self._state.conversation_count:
            self._state.conversation_count[npc_id] = 0
        self._state.conversation_count[npc_id] += 1

        # 更新玩家态度（取最新）
        self._state.player_attitudes[npc_id] = attitude

        # 更新信任度
        if npc_id not in self._state.trust_levels:
            profile = self._get_npc_profile(npc_id)
            self._state.trust_levels[npc_id] = profile.initial_trust if profile else 50

        # 根据态度调整信任度
        if attitude == "aggressive":
            self._state.trust_levels[npc_id] = max(0, self._state.trust_levels[npc_id] - 5)
        elif attitude == "friendly":
            self._state.trust_levels[npc_id] = min(100, self._state.trust_levels[npc_id] + 3)

        # 记录已回答的问题类型
        for keyword in keywords:
            if npc_id not in self._state.answered_questions:
                self._state.answered_questions[npc_id] = set()
            self._state.answered_questions[npc_id].add(keyword)

    def _build_fake_memory_context(self, npc_id: str) -> str:
        """构建假记忆上下文"""
        dialogues = self._load_dialogues()
        fake_templates = dialogues.get("fake_memory_templates", {})

        conv_count = self._state.conversation_count.get(npc_id, 0)
        attitude = self._state.player_attitudes.get(npc_id, "neutral")

        if conv_count == 1:
            memory_key = "first_contact"
        elif attitude == "aggressive":
            memory_key = "suspicious"
        elif attitude in ["friendly", "cooperative"]:
            memory_key = "cooperative"
        else:
            return ""

        memory = fake_templates.get(memory_key, {}).get(npc_id, "")
        return memory

    def get_reply(
        self,
        npc_id: str,
        player_message: str,
        conversation_history: Optional[list[dict]] = None,
    ) -> dict:
        """
        获取演示模式回复

        Args:
            npc_id: NPC ID
            player_message: 玩家消息
            conversation_history: 对话历史（用于未来假记忆增强）

        Returns:
            包含 reply 和 metadata 的字典
        """
        # conversation_history 保留用于未来版本增强假记忆系统
        profile = self._get_npc_profile(npc_id)
        if not profile:
            return {
                "reply": "NPC 配置不存在。",
                "mode": "demo",
                "error": "npc_not_found",
            }

        # 检测关键词和态度
        keywords = self._detect_keywords(player_message)
        attitude = self._detect_attitude(player_message)

        # 更新状态
        self._update_state(npc_id, keywords, attitude)

        # 获取回复
        reply = self._get_response_for_keywords(profile, keywords, npc_id)

        if not reply:
            reply = random.choice(profile.responses.get("default", ["我不太理解你的意思。"]))

        # 构建响应元数据
        metadata = {
            "mode": "demo",
            "npc_id": npc_id,
            "keywords_detected": keywords,
            "attitude": attitude,
            "trust_level": self._state.trust_levels.get(npc_id, profile.initial_trust),
            "conversation_count": self._state.conversation_count.get(npc_id, 1),
        }

        return {
            "reply": reply,
            "metadata": metadata,
        }

    def get_trust_level(self, npc_id: str) -> int:
        """获取 NPC 当前信任度"""
        if npc_id in self._state.trust_levels:
            return self._state.trust_levels[npc_id]

        profile = self._get_npc_profile(npc_id)
        return profile.initial_trust if profile else 50

    def get_conversation_count(self, npc_id: str) -> int:
        """获取对话轮次"""
        return self._state.conversation_count.get(npc_id, 0)

    def reset_state(self, npc_id: Optional[str] = None) -> None:
        """重置状态"""
        if npc_id:
            self._state.conversation_count.pop(npc_id, None)
            self._state.trust_levels.pop(npc_id, None)
            self._state.player_attitudes.pop(npc_id, None)
            self._state.answered_questions.pop(npc_id, None)
            self._state.fake_memories.pop(npc_id, None)
        else:
            self._state = DemoEngineState()


# 全局单例
_demo_engine: Optional[DemoEngine] = None


def get_demo_engine() -> DemoEngine:
    """获取演示引擎单例"""
    global _demo_engine
    if _demo_engine is None:
        _demo_engine = DemoEngine()
    return _demo_engine
