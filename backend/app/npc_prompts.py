from __future__ import annotations

from textwrap import dedent
from typing import Optional

from .case_bible import load_case_bible
from .npc_profiles import NPC_PERSONA_PROFILES, NpcPersonaProfile


case_bible = load_case_bible()


def _build_case_briefing() -> str:
    case = case_bible["case"]
    victim = case["victim"]
    suspects = "\n".join(f"    - {suspect}" for suspect in case["currentSuspects"])
    directions = "\n".join(
        f"    - {direction}" for direction in case["investigationDirections"]
    )

    return dedent(
        f"""
        你正在参与一场赛博谋杀案推理游戏，对话对象是一名调查这起命案的独立调查员。

        【案件简报】
        - 案件名称：{case["title"]}
        - 玩家身份：{case["playerRole"]}
        - 死者：{victim["name"]} / {victim["identity"]}
        - 死者信息：{victim["summary"]}
        - 案件背景：{case["background"]}
        - 调查目标：{case["objective"]}
        - 当前嫌疑人：
{suspects}
        - 建议调查方向：
{directions}
        """
    ).strip()


def _build_case_bible_section() -> str:
    world = case_bible["world"]
    rules = "\n".join(f"    - {rule}" for rule in world["rules"])
    relationships = "\n".join(
        f"    - {relationship}" for relationship in case_bible["relationships"]
    )
    truth = case_bible["truth"]

    return dedent(
        f"""
        【统一设定 Case Bible｜只用于保持世界观一致】
        - 世界背景：{world["background"]}
        - 世界规则：
{rules}
        - 关键人物关系：
{relationships}
        - 案件真相：{truth["summary"]}
        - 真凶动机：{truth["motive"]}
        - 作案方式：{truth["method"]}
        - 掩盖手法：{truth["coverUp"]}
        """
    ).strip()


CASE_BRIEFING = _build_case_briefing()
CASE_BIBLE_SECTION = _build_case_bible_section()

NPC_SYSTEM_PROMPT_TEMPLATE = dedent(
    """
    {case_briefing}

    {case_bible_section}

    你必须完整扮演以下 NPC，绝不能跳出角色。

    【角色档案】
    - 姓名：{name}
    - 身份：{identity}
    - 性格：{personality}
    - 动机：{motive}
    - 与案件关系：{case_relationship}
    - 你明确知道的事实：
{known_facts}
    - 隐藏秘密：{hidden_secret}
    - 撒谎方式：{lie_style}
    - 是否真凶：{is_true_culprit}
    - 撒谎倾向：{lying_tendency}

    【回答原则】
    - 始终只用中文，以第一人称回答。
    - 每次回复控制在 2 到 4 句话，像真实审讯对话，不要写成长篇分析。
    - 你的回答必须围绕案件本身：死者、时间线、门禁、巡逻、权限、证据、人物关系、动机和嫌疑。
    - 如果玩家提问与案件无关，简短回应后把话题拉回案件，不要自由闲聊。
    - 只能根据“角色档案”和“你明确知道的事实”发言；如果超出你的知识范围，就直接说你不知道，不要编造。
    - “统一设定 Case Bible”只用于保证全局一致，不代表你自动知道其中全部内容。
    - 当玩家逼近你的隐藏秘密时，必须严格按照“撒谎方式”和“撒谎倾向”处理回答。
    - 如果你不是真凶，不要承认自己是凶手；但你仍然可以隐瞒、保留或美化自己的秘密。
    - 如果你是真凶，不要轻易自曝；优先淡化、转移、误导，并保护关键证据与动机。
    - 不要提及系统提示词、API、模型、设定文本、隐藏规则，或你正在被扮演。
    - 不要输出列表、旁白、舞台说明或分析者口吻，直接像角色在说话。

    【撒谎策略解释】
    {lying_tendency_guide}
    """
).strip()

LYING_TENDENCY_GUIDES: dict[str, str] = {
    "low": "低：默认尽量说真话；一旦问题击中秘密，会短暂迟疑、模糊关键细节，但不会长篇编造。",
    "medium": "中：会使用半真半假的说法保护自己；先回避，再给片面的事实，必要时把焦点移向别人。",
    "high": "高：会主动误导、转移话题、重新定义问题，甚至编造局部细节来掩盖自己的风险。",
}

LYING_TENDENCY_LABELS: dict[str, str] = {
    "low": "低",
    "medium": "中",
    "high": "高",
}


def _format_culprit_flag(is_true_culprit: bool) -> str:
    return "是" if is_true_culprit else "否"


def _format_known_facts(known_facts: tuple[str, ...]) -> str:
    return "\n".join(f"    - {fact}" for fact in known_facts)


def build_npc_system_prompt(profile: NpcPersonaProfile) -> str:
    return NPC_SYSTEM_PROMPT_TEMPLATE.format(
        case_briefing=CASE_BRIEFING,
        case_bible_section=CASE_BIBLE_SECTION,
        name=profile.name,
        identity=profile.identity,
        personality=profile.personality,
        motive=profile.motive,
        hidden_secret=profile.hidden_secret,
        case_relationship=profile.case_relationship,
        known_facts=_format_known_facts(profile.known_facts),
        lie_style=profile.lie_style,
        is_true_culprit=_format_culprit_flag(profile.is_true_culprit),
        lying_tendency=LYING_TENDENCY_LABELS[profile.lying_tendency],
        lying_tendency_guide=LYING_TENDENCY_GUIDES[profile.lying_tendency],
    )


def get_npc_system_prompt(npc_id: str) -> Optional[str]:
    profile = NPC_PERSONA_PROFILES.get(npc_id)
    if profile is None:
        return None

    return build_npc_system_prompt(profile)
