import caseBibleData from "./case-bible.json";
import type { CaseBibleData, CaseMeta, ChatMessage, Clue, Npc } from "../types/game";

const caseBible = caseBibleData as CaseBibleData;

// 真正的凶手 ID（仅用于验证玩家指控）
export const culpritId = caseBible.truth.culpritId;

export const caseFile: CaseMeta = {
  id: caseBible.case.id,
  title: caseBible.case.title,
  phase: "Phase 01 / Case Brief",
  district: caseBible.case.district,
  threatLevel: caseBible.case.threatLevel,
  briefing: caseBible.case.shortBriefing,
  objective: caseBible.case.objective,
  brief: {
    playerRole: caseBible.case.playerRole,
    victim: caseBible.case.victim,
    background: caseBible.case.background,
    currentSuspects: [...caseBible.case.currentSuspects],
    investigationDirections: [...caseBible.case.investigationDirections],
  },
  worldBackground: caseBible.world.background,
  relationshipMap: [...caseBible.relationships],
};

export const npcs: Npc[] = caseBible.npcs.map((npc) => ({
  id: npc.id,
  name: npc.name,
  role: npc.role,
  status: npc.status,
  trustLevel: npc.trustLevel,
  accentColor: npc.accentColor,
  tagline: npc.tagline,
  investigationFocus: npc.investigationFocus,
  avatarSeed: npc.avatarSeed,
}));

export const clues: Clue[] = [
  {
    id: "badge-scan",
    title: "复制门禁扫描",
    summary:
      "案发前 40 秒，Nova Lin 的门禁凭证在冷却井机房外出现第二次扫描，功率曲线与她本人常用门禁不一致。",
    category: "门禁记录",
    sourceNpcId: "nova",
    status: "unlocked",
  },
  {
    id: "ghost-proxy",
    title: "废弃中继洗流",
    summary:
      "案发后 5 分钟内，塔区一段内部流量被转发到旧城区废弃中继站，像是在集中清洗日志痕迹。",
    category: "网络痕迹",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "thermal-gap",
    title: "12 秒热成像盲区",
    summary:
      "Echo-7 的巡逻日志在冷却井附近缺失了 12 秒热成像，盲区恰好覆盖死者坠落前的关键窗口。",
    category: "监控异常",
    sourceNpcId: "echo",
    status: "locked",
  },
  {
    id: "vault-key",
    title: "离线维护签名密钥",
    summary:
      "有一枚未登记的离线维护签名曾在案发窗口被调用，它可以绕过主审计链改写巡逻与维护记录。",
    category: "权限链",
    sourceNpcId: "iris",
    status: "locked",
  },
  {
    id: "mirror-contract",
    title: "MIRROR-9 合同副本",
    summary:
      "黑市流出的镜像项目合同显示付款代码来自雨幕塔内部项目，说明有人在出售城市级能源镜像数据。",
    category: "地下交易",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "maintenance-route",
    title: "巡逻改线命令",
    summary:
      "Echo-7 在案发前被临时改线，绕开 7 号维护桥和冷却井入口，改线理由却没有对应检修工单。",
    category: "调度记录",
    sourceNpcId: "iris",
    status: "locked",
  },
];

const systemMessage = (id: string, text: string, timestamp: string): ChatMessage => ({
  id,
  speakerId: "system",
  speakerType: "system",
  text,
  timestamp,
});

const npcMessage = (
  id: string,
  speakerId: string,
  text: string,
  timestamp: string,
  unlockClueIds?: string[],
): ChatMessage => ({
  id,
  speakerId,
  speakerType: "npc",
  text,
  timestamp,
  unlockClueIds,
});

export const initialConversations: Record<string, ChatMessage[]> = {
  nova: [
    systemMessage(
      "sys-nova-1",
      "频道已接入安保工程师 Nova Lin。她是死者遇害前最后一个被复制门禁的人，也是当前首批嫌疑人之一。",
      "23:09",
    ),
    npcMessage(
      "nova-1",
      "nova",
      "我没有杀程映秋。她死前确实联系过我，但那是为了核验一枚异常维护签名，不是为了见什么凶手。有人先复制了我的门禁，再故意让我离开岗位。",
      "23:11",
      ["badge-scan"],
    ),
  ],
  shade: [
    systemMessage(
      "sys-shade-1",
      "频道已切到黑市线人 Shade Mori。你需要从他口中确认 MIRROR-9 合同和谁在替凶手清洗流量。",
      "23:05",
    ),
    npcMessage(
      "shade-1",
      "shade",
      "你想知道谁把程映秋的审计追到了黑市？先别急着问死人的事，先告诉我，你手上是不是已经有一枚被复制过的门禁凭证了。",
      "23:06",
    ),
  ],
  echo: [
    systemMessage(
      "sys-echo-1",
      "Echo-7 的缓存正在修复。它是最接近现场的机械证人，但最关键的 12 秒热成像目前仍存在缺口。",
      "23:00",
    ),
    npcMessage(
      "echo-1",
      "echo",
      "巡逻路径已被重写。授权来源匹配 Iris Vale 的离线维护权限。之后，我在冷却井附近丢失了 12 秒热源记录，程映秋就是在那段窗口里坠落的。",
      "23:02",
    ),
  ],
  iris: [
    systemMessage(
      "sys-iris-1",
      "Iris Vale 只接受延迟回复。她掌握最高维护权限，也是唯一能同时解释巡逻改线和离线签名的人。",
      "22:57",
    ),
    npcMessage(
      "iris-1",
      "iris",
      "如果你真想找出凶手，就别只盯着我的权限。程映秋不是因为一场普通断电死的，她是因为有人先拿到了她手里的审计证据。",
      "22:59",
    ),
  ],
};

export const scriptedReplies: Record<string, ChatMessage[]> = {
  nova: [
    npcMessage(
      "nova-r1",
      "nova",
      "那条警报来自内部维护频道，而且只发给了我一个人。它把我引到西侧走廊，像是一段写好给我执行的撤离脚本。",
      "23:15",
    ),
    npcMessage(
      "nova-r2",
      "nova",
      "你可以去看第二次刷卡的功率曲线。那不是我平时用的门禁发射强度，有人用复制器伪造过我的凭证。",
      "23:18",
      ["thermal-gap"],
    ),
    npcMessage(
      "nova-r3",
      "nova",
      "断电前我瞥见维护通道的灯带切成了黄色，那是 Iris 才能拉起的优先检修级别。谁想让 Echo 绕路，答案已经很窄了。",
      "23:22",
      ["maintenance-route"],
    ),
  ],
  shade: [
    npcMessage(
      "shade-r1",
      "shade",
      "旧城区那座废弃中继站还在偷偷吃电。有人把塔区流量扔进去洗了一遍，就像给脚印换了一双鞋底。",
      "23:12",
      ["ghost-proxy"],
    ),
    npcMessage(
      "shade-r2",
      "shade",
      "那份合同我见过，代号就是 MIRROR-9。你继续顺着付款代码挖，最后会挖到一个只属于塔区内部权限的口袋。",
      "23:16",
      ["mirror-contract"],
    ),
    npcMessage(
      "shade-r3",
      "shade",
      "接头人说过一句话: 真正能开门的，不在门禁上，在离线签名里。你要是还不明白我在影射谁，那就白来这一趟了。",
      "23:19",
      ["vault-key"],
    ),
  ],
  echo: [
    npcMessage(
      "echo-r1",
      "echo",
      "纠正。不是一个人进入冷却井区域，而是两组人类热源短暂重叠。第二组被强制覆盖成背景噪声。",
      "23:08",
      ["thermal-gap"],
    ),
    npcMessage(
      "echo-r2",
      "echo",
      "路径重写命令来自离线签名缓存。授权未经过主链广播，因此审计系统没有留下常规记录。",
      "23:13",
      ["vault-key"],
    ),
    npcMessage(
      "echo-r3",
      "echo",
      "附加记忆恢复: 我被要求绕开 7 号维护桥，理由是冷却井检修。但当时系统不存在任何对应工单。",
      "23:17",
      ["maintenance-route"],
    ),
  ],
  iris: [
    npcMessage(
      "iris-r1",
      "iris",
      "我修改巡逻路线，是因为有人提前警告我冷却井会被动手脚。那份警告来自匿名镜像邮箱，而不是正式运维通知。",
      "23:10",
      ["maintenance-route"],
    ),
    npcMessage(
      "iris-r2",
      "iris",
      "离线密钥并不在我身上，但我承认它曾属于我的权限包。有人复制了签名，又把锅精准地扔回给了我。",
      "23:14",
      ["vault-key"],
    ),
    npcMessage(
      "iris-r3",
      "iris",
      "如果 Shade 真给你看了合同，你就会发现付款代码来自一套内部镜像项目。我负责维护塔，不负责替别人的贪婪收尸。",
      "23:21",
      ["mirror-contract"],
    ),
  ],
};

export const starterClueIds = clues
  .filter((clue) => clue.status !== "locked")
  .map((clue) => clue.id);

export const suspectMeter = ["低", "中", "高", "极高"] as const;
