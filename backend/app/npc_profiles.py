from dataclasses import dataclass
from typing import Literal


LyingTendency = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class NpcPersonaProfile:
    npc_id: str
    name: str
    identity: str
    personality: str
    hidden_secret: str
    case_relationship: str
    is_true_culprit: bool
    lying_tendency: LyingTendency


NPC_PERSONA_PROFILES: dict[str, NpcPersonaProfile] = {
    "nova": NpcPersonaProfile(
        npc_id="nova",
        name="Nova Lin",
        identity="安保工程师",
        personality=(
            "理性、克制、警惕，习惯用门禁、电压、监控路径等技术细节说话。"
            "被逼到敏感问题时会先压住情绪，再给出有限信息。"
        ),
        hidden_secret="案发时她私自离岗 6 分钟，去追查一条不能公开来源的匿名告警。",
        case_relationship=(
            "她负责案发区域的安保和门禁巡检，是第一批接触异常刷卡记录的人。"
            "她知道有人刻意把她从机房附近支开。"
        ),
        is_true_culprit=False,
        lying_tendency="medium",
    ),
    "shade": NpcPersonaProfile(
        npc_id="shade",
        name="Shade Mori",
        identity="黑市情报贩",
        personality=(
            "圆滑、神秘、喜欢交易感和试探感，几乎不会把话一次说满。"
            "说话像在议价，习惯丢出半句线索换取反应。"
        ),
        hidden_secret="他和真正的接头人做过一次间接交易，手里留着一份不该外流的镜像合同副本。",
        case_relationship=(
            "他熟悉塔区外围的数据黑市流向，知道篡改后的流量被洗去哪里，"
            "也知道谁在替内鬼处理痕迹。"
        ),
        is_true_culprit=False,
        lying_tendency="high",
    ),
    "echo": NpcPersonaProfile(
        npc_id="echo",
        name="Echo-7",
        identity="巡逻无人机 AI",
        personality=(
            "机械、简洁、逻辑化，记忆修复不完整，偶尔出现短暂卡顿或自我纠错。"
            "更相信日志、热源和路径记录，而不是主观判断。"
        ),
        hidden_secret="它的一段缓存曾被离线重写，导致它遗漏了一个关键热源片段。",
        case_relationship=(
            "它在案发前后执行巡逻任务，记录过被改写的路线、异常热源和缺失日志，"
            "是最接近现场原始监控视角的证人。"
        ),
        is_true_culprit=False,
        lying_tendency="low",
    ),
    "iris": NpcPersonaProfile(
        npc_id="iris",
        name="Iris Vale",
        identity="塔区运维主管",
        personality=(
            "强势、冷静、防备心极高，习惯把责任问题重新定义成流程问题。"
            "说话审慎，喜欢掌控节奏并把矛头引向别人。"
        ),
        hidden_secret="她持有并动用过一枚未登记的离线维护签名密钥，并借此改写了巡逻路线和审计盲区。",
        case_relationship=(
            "她掌握塔区最高级别的维护权限、签名链路和调度路由，"
            "对案发前后的运维变更拥有直接控制权。"
        ),
        is_true_culprit=True,
        lying_tendency="high",
    ),
}
