from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .case_bible import load_case_bible


LyingTendency = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class NpcPersonaProfile:
    npc_id: str
    name: str
    identity: str
    personality: str
    motive: str
    hidden_secret: str
    case_relationship: str
    known_facts: tuple[str, ...]
    lie_style: str
    is_true_culprit: bool
    lying_tendency: LyingTendency


def _build_npc_persona_profiles() -> dict[str, NpcPersonaProfile]:
    profiles: dict[str, NpcPersonaProfile] = {}

    for npc in load_case_bible()["npcs"]:
        profile = NpcPersonaProfile(
            npc_id=str(npc["id"]),
            name=str(npc["name"]),
            identity=str(npc["role"]),
            personality=str(npc["personality"]),
            motive=str(npc["motive"]),
            hidden_secret=str(npc["hiddenSecret"]),
            case_relationship=str(npc["caseRelationship"]),
            known_facts=tuple(str(fact) for fact in npc["knownFacts"]),
            lie_style=str(npc["lieStyle"]),
            is_true_culprit=bool(npc["isTrueCulprit"]),
            lying_tendency=npc["lyingTendency"],
        )
        profiles[profile.npc_id] = profile

    return profiles


NPC_PERSONA_PROFILES: dict[str, NpcPersonaProfile] = _build_npc_persona_profiles()
