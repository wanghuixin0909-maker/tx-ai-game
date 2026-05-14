import type { CaseMeta, ChatMessage, Clue, Npc } from "../types/game";

export const caseFile: CaseMeta = {
  id: "case-neon-echo",
  title: "NEON ECHO // 霓虹回声失窃案",
  phase: "Phase 02 / 交叉审讯",
  district: "Sector-9, 雨幕塔区",
  threatLevel: "Amber",
  briefing:
    "天穹能源的数据心脏在断电前 37 秒被植入未知指令，整座塔区的安保记录随后被重写。",
  objective: "锁定篡改源头，确认内鬼与黑市接头人是否为同一目标。",
};

export const npcs: Npc[] = [
  {
    id: "nova",
    name: "Nova Lin",
    role: "安保工程师",
    status: "online",
    trustLevel: 72,
    accentColor: "#5ef2ff",
    tagline: "熟悉塔区监控拓扑，但在断电窗口内离线 6 分钟。",
    avatarSeed: "NL",
  },
  {
    id: "shade",
    name: "Shade Mori",
    role: "黑市情报贩",
    status: "guarded",
    trustLevel: 39,
    accentColor: "#ff4fd8",
    tagline: "知道数据残片的去向，只愿用暗语交换信息。",
    avatarSeed: "SM",
  },
  {
    id: "echo",
    name: "Echo-7",
    role: "巡逻无人机 AI",
    status: "suspect",
    trustLevel: 58,
    accentColor: "#93ff7a",
    tagline: "记忆区块被人为裁切，保留了不完整的热成像日志。",
    avatarSeed: "E7",
  },
  {
    id: "iris",
    name: "Iris Vale",
    role: "塔区运维主管",
    status: "offline",
    trustLevel: 24,
    accentColor: "#ffd15e",
    tagline: "授权链最高级别持有者，事故后一直拒绝公开露面。",
    avatarSeed: "IV",
  },
];

export const clues: Clue[] = [
  {
    id: "badge-scan",
    title: "异常门禁扫描",
    summary: "停电前 40 秒，Nova 的门禁令牌在冷却中的机房门口被二次刷卡。",
    category: "出入记录",
    sourceNpcId: "nova",
    status: "unlocked",
  },
  {
    id: "ghost-proxy",
    title: "幽灵代理节点",
    summary: "Shade 提到有人把塔区内部流量转发到旧城区的废弃中继站。",
    category: "网络痕迹",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "thermal-gap",
    title: "热成像空窗",
    summary: "Echo-7 的巡逻日志里有一段 12 秒热源被整体抹除的矩形盲区。",
    category: "监控异常",
    sourceNpcId: "echo",
    status: "locked",
  },
  {
    id: "vault-key",
    title: "离线签名密钥",
    summary: "Iris 保留着一枚未登记的离线维护密钥，可绕过主审计链。",
    category: "权限链",
    sourceNpcId: "iris",
    status: "locked",
  },
  {
    id: "mirror-contract",
    title: "镜像合同",
    summary: "黑市上传闻的赏金合同，付款方代号与塔区内部项目缩写一致。",
    category: "地下交易",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "maintenance-route",
    title: "维护通道改线",
    summary: "运维主管在事故前一晚临时改写了巡逻无人机的绕行路线。",
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
      "频道已接入安保工程师 Nova Lin。她愿意配合，但明显在隐藏自己离线的真正原因。",
      "23:09",
    ),
    npcMessage(
      "nova-1",
      "nova",
      "我没有拔掉电源，我只是追着一条假的告警跑进了西侧走廊。有人想让我离开机房。",
      "23:11",
      ["badge-scan"],
    ),
  ],
  shade: [
    systemMessage(
      "sys-shade-1",
      "频道已切到黑市线人 Shade Mori。通话被三层噪声代理伪装，信号极不稳定。",
      "23:05",
    ),
    npcMessage(
      "shade-1",
      "shade",
      "你想知道谁在卖塔区的秘密？先告诉我，你手里是不是已经有一张被复制过的门禁令牌。",
      "23:06",
    ),
  ],
  echo: [
    systemMessage(
      "sys-echo-1",
      "Echo-7 的记忆块正在实时修复。部分回答可能出现跳帧或语义重叠。",
      "23:00",
    ),
    npcMessage(
      "echo-1",
      "echo",
      "巡逻路径... 被更新。权限来源匹配 Iris Vale。之后，我看见了一块不应该存在的低温矩形。",
      "23:02",
    ),
  ],
  iris: [
    systemMessage(
      "sys-iris-1",
      "Iris Vale 只接受单向留言。她的代理终端每 90 秒才会返回一段整理过的回应。",
      "22:57",
    ),
    npcMessage(
      "iris-1",
      "iris",
      "如果你真想抓到内鬼，别只盯着我。机房里那台老旧冷却塔比任何人都更会说谎。",
      "22:59",
    ),
  ],
};

export const scriptedReplies: Record<string, ChatMessage[]> = {
  nova: [
    npcMessage(
      "nova-r1",
      "nova",
      "那条假告警来自内部维护频道，而且只发给了我一个人。它把我引到盲区，像是提前写好的路线剧本。",
      "23:15",
    ),
    npcMessage(
      "nova-r2",
      "nova",
      "你可以去查第二次刷卡的电压波形。那不是我平时用的令牌发射功率，有人做了复制器。",
      "23:18",
      ["thermal-gap"],
    ),
    npcMessage(
      "nova-r3",
      "nova",
      "停电前我瞥见运维通道的灯带突然切成了黄频，那是 Iris 的维护优先级才有的颜色。",
      "23:22",
      ["maintenance-route"],
    ),
  ],
  shade: [
    npcMessage(
      "shade-r1",
      "shade",
      "旧城区有个废弃中继站还在吃电。有人把塔区流量扔进去洗了一遍，就像给脚印重新上了别人的鞋码。",
      "23:12",
      ["ghost-proxy"],
    ),
    npcMessage(
      "shade-r2",
      "shade",
      "赏金合同我见过，代号是 MIRROR-9。只要你继续往权限链上挖，付款人的轮廓就会自己浮出来。",
      "23:16",
      ["mirror-contract"],
    ),
    npcMessage(
      "shade-r3",
      "shade",
      "接头人说过一句话: '真正的门，不在门禁上，在维护签名里。' 你明白我在说谁。",
      "23:19",
      ["vault-key"],
    ),
  ],
  echo: [
    npcMessage(
      "echo-r1",
      "echo",
      "纠正。不是一个人进入盲区，而是两组温度轮廓被叠加。第二组被强制覆盖成背景值。",
      "23:08",
      ["thermal-gap"],
    ),
    npcMessage(
      "echo-r2",
      "echo",
      "路径重写命令来自离线签名缓存。授权者未经过主链广播，因此审计系统没有留下常规记录。",
      "23:13",
      ["vault-key"],
    ),
    npcMessage(
      "echo-r3",
      "echo",
      "附加记忆恢复: 我被要求绕开 7 号维护桥，理由是冷却塔检修。但当时没有任何检修工单。",
      "23:17",
      ["maintenance-route"],
    ),
  ],
  iris: [
    npcMessage(
      "iris-r1",
      "iris",
      "我修改巡逻路线，是因为有人提前警告我冷却塔会被动过手脚。那份警告来自匿名镜像邮箱。",
      "23:10",
      ["maintenance-route"],
    ),
    npcMessage(
      "iris-r2",
      "iris",
      "离线密钥并不在我身上，但我承认它曾属于我的权限包。有人复制了签名，又把锅精准地丢回给我。",
      "23:14",
      ["vault-key"],
    ),
    npcMessage(
      "iris-r3",
      "iris",
      "如果 Shade 真把合同给你看了，你就会发现付款代号来自一套内部镜像项目。我只负责保塔，不负责替别人灭口。",
      "23:21",
      ["mirror-contract"],
    ),
  ],
};

export const starterClueIds = clues
  .filter((clue) => clue.status !== "locked")
  .map((clue) => clue.id);

export const suspectMeter = [
  "低",
  "中",
  "高",
  "极高",
] as const;

