import {
  caseFile as defaultCaseFile,
  caseTruth as defaultCaseTruth,
  clues as defaultClues,
  initialConversations as defaultInitialConversations,
  npcs as defaultNpcs,
  scriptedReplies as defaultScriptedReplies,
  starterClueIds as defaultStarterClueIds,
} from "./mockGame";
import type {
  CaseCategory,
  CaseDefinition,
  CaseMeta,
  CaseTruth,
  ChatMessage,
  Clue,
  Npc,
} from "../types/game";

function systemMessage(id: string, text: string, timestamp: string): ChatMessage {
  return {
    id,
    speakerId: "system",
    speakerType: "system",
    text,
    timestamp,
  };
}

function npcMessage(
  id: string,
  speakerId: string,
  text: string,
  timestamp: string,
  unlockClueIds?: string[],
): ChatMessage {
  return {
    id,
    speakerId,
    speakerType: "npc",
    text,
    timestamp,
    unlockClueIds,
  };
}

function buildStarterClueIds(clues: Clue[]) {
  return clues.filter((clue) => clue.status !== "locked").map((clue) => clue.id);
}

function createCase(
  definition: Omit<CaseDefinition, "starterClueIds"> & { starterClueIds?: string[] },
): CaseDefinition {
  return {
    ...definition,
    starterClueIds: definition.starterClueIds ?? buildStarterClueIds(definition.clues),
  };
}

const defaultCase = createCase({
  id: defaultCaseFile.id,
  categoryId: "cyber-conspiracy",
  difficulty: "困难",
  estimatedMinutes: 35,
  selectionSummary: "赛博塔区谋杀案，适合想体验完整 AI 审问感和多线证据链的玩家。",
  tags: ["赛博", "企业阴谋", "AI 审问"],
  remoteSupport: false,
  caseFile: defaultCaseFile,
  truth: defaultCaseTruth as CaseTruth,
  accusation: {
    requiredClueIds: ["badge-scan", "ghost-proxy", "thermal-gap"],
    suspectEvidenceMap: {
      nova: ["badge-scan"],
      shade: ["ghost-proxy", "mirror-contract"],
      echo: ["thermal-gap"],
      iris: [
        "badge-scan",
        "ghost-proxy",
        "thermal-gap",
        "vault-key",
        "maintenance-route",
        "mirror-contract",
      ],
    },
    successArchiveLines: ["案件归档完成。", "真相已恢复。", "记忆碎片同步结束。"],
    failureArchiveLines: ["系统异常", "错误目标已标记", "案件归档失败。"],
  },
  npcs: defaultNpcs,
  clues: defaultClues,
  initialConversations: defaultInitialConversations,
  scriptedReplies: defaultScriptedReplies,
  starterClueIds: defaultStarterClueIds,
  suggestedPrompts: {
    nova: [
      "你离岗那 6 分钟到底去了哪里？",
      "谁给你发了那条假的维护警报？",
      "第二次门禁扫描为什么不像你的操作习惯？",
    ],
    shade: [
      "MIRROR-9 合同到底是谁带进黑市的？",
      "谁在旧城中继站替凶手清洗流量？",
      "付款代码为什么会指向塔区内部项目？",
    ],
    echo: [
      "缺失的 12 秒热成像里到底出现了几组热源？",
      "巡逻改线命令是从哪里下发的？",
      "为什么系统里没有对应的检修工单？",
    ],
    iris: [
      "离线签名密钥为什么会出现在案发窗口？",
      "你为什么有权限改动 Echo-7 的巡逻路径？",
      "程映秋死前掌握了你什么把柄？",
    ],
  },
});

const mistHarborCaseFile: CaseMeta = {
  id: "case-mist-harbor-inheritance-v1",
  title: "雾港继承案",
  phase: "阶段 01 / 案件简报",
  district: "雾港半岛",
  threatLevel: "高风险",
  briefing: "豪门家主在私人码头酒会后坠海身亡，遗嘱与监控同时出现异常。",
  objective: "厘清遗嘱变更、医疗记录与港口动线，找出真正策划者。",
  brief: {
    playerRole: "你是受托独立调查的海事律师，需要在家族董事会开会前完成取证。",
    victim: {
      name: "沈曜廷",
      identity: "雾港航运集团创始人",
      summary: "沈曜廷原计划在周年酒会上宣布新的继承安排，却在散场后于私人泊位坠海身亡。",
    },
    background: "家族企业正准备出售海外航线，继承结构的每一次变动都牵扯巨额利益。",
    currentSuspects: ["宁澜", "顾砚", "闻汐", "许至衡"],
    investigationDirections: [
      "核对酒会后码头的人员流向",
      "追查遗嘱补充页和见证签名",
      "确认受害者是否被提前用药或误导",
    ],
  },
  worldBackground: "雾港半岛的旧家族与新资本交错，律师、安保和媒体都可能既是证人也是棋子。",
  relationshipMap: [
    "宁澜负责起草最新遗嘱草案，是受害者最信任的外部律师。",
    "顾砚控制当晚的码头安保与船只调度，能改动最核心的出入记录。",
    "闻汐长期追踪集团资产转移，是受害者私生女传闻的中心人物。",
    "许至衡掌管家族办公室，对离岸账户和董事会投票最熟悉。",
  ],
};

const mistHarborNpcs: Npc[] = [
  {
    id: "nova",
    name: "宁澜",
    role: "家族律师",
    status: "guarded",
    trustLevel: 49,
    accentColor: "#8BD3FF",
    tagline: "她起草过遗嘱，但不愿替任何人背锅。",
    investigationFocus: "遗嘱补充页、签名见证和会后会面顺序。",
    avatarSeed: "nova",
  },
  {
    id: "shade",
    name: "顾砚",
    role: "私人安保主管",
    status: "suspect",
    trustLevel: 37,
    accentColor: "#FFC46B",
    tagline: "掌控码头通道的人，最懂谁能神不知鬼不觉离开。",
    investigationFocus: "泊位通道、值班排班和坠海前最后五分钟。",
    avatarSeed: "shade",
  },
  {
    id: "echo",
    name: "闻汐",
    role: "调查记者",
    status: "online",
    trustLevel: 58,
    accentColor: "#9CFFB8",
    tagline: "她手里有爆料，也可能有不能公开的私人情绪。",
    investigationFocus: "偷拍视频、记者线人和被压下的家族丑闻。",
    avatarSeed: "echo",
  },
  {
    id: "iris",
    name: "许至衡",
    role: "家族办公室负责人",
    status: "guarded",
    trustLevel: 43,
    accentColor: "#F7A8FF",
    tagline: "他比任何人都清楚钱流向了哪里。",
    investigationFocus: "离岸账户、投票授权和财务遮掩链路。",
    avatarSeed: "iris",
  },
];

const mistHarborClues: Clue[] = [
  {
    id: "wet-will",
    title: "受潮遗嘱补充页",
    summary: "新遗嘱补充页在坠海后才被送回书房，纸张边缘带有海水盐痕。",
    category: "文书异常",
    sourceNpcId: "nova",
    status: "unlocked",
  },
  {
    id: "pier-camera-gap",
    title: "三码头监控空档",
    summary: "三码头在 22:41 到 22:48 的录像被手动覆盖，只有安保主控能操作。",
    category: "监控异常",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "sedative-receipt",
    title: "镇静剂补领单",
    summary: "受害者私人休息室附近出现一张补领单，签收人被故意涂改。",
    category: "医疗线索",
    sourceNpcId: "echo",
    status: "locked",
  },
  {
    id: "offshore-ledger",
    title: "离岸分红台账",
    summary: "一笔原本不属于继承体系的分红，被提前记入许至衡控制的过桥公司。",
    category: "财务记录",
    sourceNpcId: "iris",
    status: "locked",
  },
  {
    id: "launch-route",
    title: "快艇调度改签",
    summary: "当晚备用快艇的离港申请被提前改签到顾砚名下，却没有实际航程备案。",
    category: "交通记录",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "voice-amendment",
    title: "语音授权修改件",
    summary: "受害者本该在酒会前录下的授权语音被替换过，中段有明显拼接痕迹。",
    category: "音频取证",
    sourceNpcId: "nova",
    status: "locked",
  },
];

const mistHarborCase = createCase({
  id: mistHarborCaseFile.id,
  categoryId: "social-mystery",
  difficulty: "中高",
  estimatedMinutes: 28,
  selectionSummary: "豪门继承、财务操盘和码头失足疑云，偏社会派与动机博弈。",
  tags: ["豪门", "继承", "社会派"],
  remoteSupport: false,
  caseFile: mistHarborCaseFile,
  truth: {
    culpritId: "shade",
    summary: "顾砚先利用酒会后的安保盲区遮断监控，再诱导服下镇静剂的沈曜廷独自前往泊位，制造失足坠海。",
    motive: "他长期替许至衡处理灰色调度，却发现沈曜廷准备在新遗嘱中切断这条利益链，于是选择先下手。",
    coverUp: "顾砚把快艇调度、监控空档和受潮遗嘱串成一条假线，试图把焦点引向律师和家族办公室。",
  },
  accusation: {
    requiredClueIds: ["wet-will", "pier-camera-gap", "sedative-receipt"],
    suspectEvidenceMap: {
      nova: ["wet-will", "voice-amendment"],
      shade: ["pier-camera-gap", "launch-route", "sedative-receipt"],
      echo: ["sedative-receipt"],
      iris: ["offshore-ledger", "voice-amendment"],
    },
    successArchiveLines: ["码头航迹已锁定。", "继承欺瞒链闭合。", "雾港案件归档完成。"],
    failureArchiveLines: ["继承会照常召开。", "错误指控引发证词反噬。", "雾港案件结算失败。"],
  },
  npcs: mistHarborNpcs,
  clues: mistHarborClues,
  initialConversations: {
    nova: [
      systemMessage("mist-sys-nova-1", "宁澜接受了加密通话，她要求你先别把遗嘱问题公开。", "21:04"),
      npcMessage(
        "mist-nova-1",
        "nova",
        "沈曜廷确实让我准备过补充页，但我最后一次见到原件时，它还在会客厅，不该带着海水味回到书房。",
        "21:06",
        ["wet-will"],
      ),
    ],
    shade: [
      systemMessage("mist-sys-shade-1", "顾砚拒绝面对面问询，只接受远程简报。", "21:01"),
      npcMessage(
        "mist-shade-1",
        "shade",
        "三码头那晚人很多，谁都可能踩错路。你要是真想找凶手，就先别把每一个安保空档都当成我做的手脚。",
        "21:03",
      ),
    ],
    echo: [
      systemMessage("mist-sys-echo-1", "闻汐声称她拍到了不该被拍到的人。", "20:58"),
      npcMessage(
        "mist-echo-1",
        "echo",
        "我追这个家族半年了。沈曜廷死前像在等一个人，那人不是记者，也不是律师。",
        "21:00",
      ),
    ],
    iris: [
      systemMessage("mist-sys-iris-1", "许至衡只同意回答与董事会相关的问题。", "20:55"),
      npcMessage(
        "mist-iris-1",
        "iris",
        "遗嘱有没有变，不影响一个事实: 集团这周就要签海外出售。谁要是想阻止这件事，动机可不止我一个。",
        "20:57",
      ),
    ],
  },
  scriptedReplies: {
    nova: [
      npcMessage(
        "mist-nova-r1",
        "nova",
        "补充页的见证栏原本应该由我和家庭医生一起签，但最后送回来的版本只剩我的旧章，这说明有人回收过纸页。",
        "21:10",
        ["voice-amendment"],
      ),
      npcMessage(
        "mist-nova-r2",
        "nova",
        "沈曜廷那晚临时要求我把语音授权留档，他说如果自己来不及亲自宣布，就让录音替他说话。",
        "21:13",
      ),
      npcMessage(
        "mist-nova-r3",
        "nova",
        "海水痕不是意外浸湿，边缘是先折后湿，像有人把纸塞进了潮湿的外套口袋。",
        "21:16",
      ),
    ],
    shade: [
      npcMessage(
        "mist-shade-r1",
        "shade",
        "监控空档不是系统坏了，是有人用主控权限覆盖了三码头那七分钟。值班室那把主控钥匙只在我这儿挂过名。",
        "21:08",
        ["pier-camera-gap"],
      ),
      npcMessage(
        "mist-shade-r2",
        "shade",
        "备用快艇的改签我看过，但那份申请不是我的笔迹。有人想把我固定在离港记录里，好让我像最顺手的替罪羊。",
        "21:12",
        ["launch-route"],
      ),
      npcMessage(
        "mist-shade-r3",
        "shade",
        "沈曜廷走向泊位时脚步不稳，不像喝多，更像被什么药拖慢了反应。",
        "21:18",
        ["sedative-receipt"],
      ),
    ],
    echo: [
      npcMessage(
        "mist-echo-r1",
        "echo",
        "我拍到休息室外有人递过一个白色药袋，镜头太远看不清脸，但袋口露出的标签是医院配药格式。",
        "21:09",
        ["sedative-receipt"],
      ),
      npcMessage(
        "mist-echo-r2",
        "echo",
        "那晚最怪的是，顾砚明明守在主通道，却比任何人都早知道沈曜廷不见了。",
        "21:14",
      ),
      npcMessage(
        "mist-echo-r3",
        "echo",
        "沈曜廷有私下认女的传闻，可他真正害怕曝光的不是血缘，而是钱早就被搬空了。",
        "21:19",
        ["offshore-ledger"],
      ),
    ],
    iris: [
      npcMessage(
        "mist-iris-r1",
        "iris",
        "离岸台账不是秘密，但你要明白，能接触那份桥接公司分红的人只有董事会内圈和负责安保调度的人。",
        "21:11",
        ["offshore-ledger"],
      ),
      npcMessage(
        "mist-iris-r2",
        "iris",
        "沈曜廷原本想把出售收益拆成两部分，一部分给集团，一部分直接脱离家族体系。有人会因此一夜之间一无所有。",
        "21:15",
      ),
      npcMessage(
        "mist-iris-r3",
        "iris",
        "如果你怀疑我，先去核对快艇申请。真正想动手的人，必须确认码头出口只剩一条可走。",
        "21:20",
      ),
    ],
  },
  suggestedPrompts: {
    nova: ["补充页为什么会沾上海水？", "语音授权是谁提议录制的？", "见证签名为什么只剩你的旧章？"],
    shade: ["监控空档是谁能手动覆盖？", "备用快艇为什么会改签到你名下？", "沈曜廷坠海前状态为什么异常？"],
    echo: ["你拍到的药袋来自谁？", "谁最早发现沈曜廷失踪？", "你查到过哪些家族资产异常？"],
    iris: ["离岸分红为什么提前转桥？", "谁会因新遗嘱损失最大？", "你为什么一开始就把焦点推向码头出口？"],
  },
});

const theaterCaseFile: CaseMeta = {
  id: "case-white-heron-theater-v1",
  title: "白鹭剧院密室案",
  phase: "阶段 01 / 案件简报",
  district: "白鹭剧院",
  threatLevel: "极高",
  briefing: "首演谢幕前，主演在锁死的升降舞台内窒息身亡，舞台提示系统却显示一切正常。",
  objective: "拼出舞台机械、灯控日志与演员关系，破解这场伪装成意外的密室谋杀。",
  brief: {
    playerRole: "你是受剧院保险方委派的事故调查员，必须在剧院封馆前确认责任真相。",
    victim: {
      name: "林惟安",
      identity: "白鹭剧院驻场主演",
      summary: "林惟安在终幕升降台内被发现时已失去意识，舱门从内侧上锁，现场看似完全密室。",
    },
    background: "白鹭剧院多年亏损却突然重金重启，新制作背后牵涉赞助、替角和合约对赌。",
    currentSuspects: ["苏弦", "梁策", "白鹭-3", "乔蔓"],
    investigationDirections: [
      "核对终幕前所有舞台机械指令",
      "确认升降台内锁定机制是否被外部干预",
      "梳理主演与制作团队的合约冲突",
    ],
  },
  worldBackground: "在这间老剧院里，每一处吊杆、暗门和追光都可能是表演的一部分，也可能是杀意的一部分。",
  relationshipMap: [
    "苏弦是首席舞者，同时是临时顶替主演的人选。",
    "梁策掌管全场舞台机械，只有他知道每一道保险栓是否真的锁死。",
    "白鹭-3 是剧院新接入的灯控 AI，负责记录全部 cue 表与追光轨迹。",
    "乔蔓是制作人，她决定谁能上台，也决定赔付是否发生。",
  ],
};

const theaterNpcs: Npc[] = [
  {
    id: "nova",
    name: "苏弦",
    role: "首席舞者",
    status: "guarded",
    trustLevel: 52,
    accentColor: "#82E1FF",
    tagline: "她离主角只差一场事故的距离。",
    investigationFocus: "替角压力、终幕走位和主演私下争执。",
    avatarSeed: "nova",
  },
  {
    id: "shade",
    name: "梁策",
    role: "舞台机械师",
    status: "suspect",
    trustLevel: 36,
    accentColor: "#FFB36E",
    tagline: "舞台机关是他的语言，也是他最好的伪装。",
    investigationFocus: "升降台保险栓、暗门轨道和机械维护日志。",
    avatarSeed: "shade",
  },
  {
    id: "echo",
    name: "白鹭-3",
    role: "灯控 AI",
    status: "online",
    trustLevel: 67,
    accentColor: "#9EF0C3",
    tagline: "它记录一切，但不是每段记录都能被允许保留。",
    investigationFocus: "cue 表、追光路径和日志删除时点。",
    avatarSeed: "echo",
  },
  {
    id: "iris",
    name: "乔蔓",
    role: "制作人",
    status: "guarded",
    trustLevel: 44,
    accentColor: "#F4A3FF",
    tagline: "她把艺术当成生意，也把生意当成筹码。",
    investigationFocus: "保险赔付、主演合约和替角安排。",
    avatarSeed: "iris",
  },
];

const theaterClues: Clue[] = [
  {
    id: "jammed-bolt",
    title: "卡死的保险栓",
    summary: "升降台上锁用的保险栓被提前塞入薄铜片，导致看似锁定、实际延迟闭合。",
    category: "机械线索",
    sourceNpcId: "shade",
    status: "unlocked",
  },
  {
    id: "cue-sheet-rewrite",
    title: "终幕 cue 表重写",
    summary: "终幕前 9 分钟，灯控 cue 表被人手动重写，追光停留时长异常增加。",
    category: "系统日志",
    sourceNpcId: "echo",
    status: "locked",
  },
  {
    id: "missing-rose",
    title: "消失的白玫瑰",
    summary: "主演手持的白玫瑰道具被提前替换，花柄中空，藏过一次性吸入胶囊。",
    category: "道具取证",
    sourceNpcId: "nova",
    status: "locked",
  },
  {
    id: "sponsor-rider",
    title: "赞助附加条款",
    summary: "新制作合约规定，若主演因健康或事故无法履约，保险赔付直接进入制作项目账户。",
    category: "合同条款",
    sourceNpcId: "iris",
    status: "locked",
  },
  {
    id: "trapdoor-scuff",
    title: "暗门擦痕",
    summary: "升降台后侧暗门地轨有新鲜擦痕，说明有人在谢幕前后短暂进出过封闭舱体。",
    category: "现场痕迹",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "rehearsal-audio",
    title: "彩排争执录音",
    summary: "录音中乔蔓警告主演不要在首演当天公开解约，否则全组都会一起沉下去。",
    category: "音频证据",
    sourceNpcId: "echo",
    status: "locked",
  },
];

const theaterCase = createCase({
  id: theaterCaseFile.id,
  categoryId: "locked-room",
  difficulty: "困难",
  estimatedMinutes: 32,
  selectionSummary: "偏本格密室，核心乐趣在于舞台机关、暗门和伪意外设计。",
  tags: ["密室", "舞台", "机关"],
  remoteSupport: false,
  caseFile: theaterCaseFile,
  truth: {
    culpritId: "iris",
    summary: "乔蔓利用制作人身份重写终幕 cue 表、调走舞台注意力，并借换道具让主演吸入致昏胶囊，再让梁策惯常忽视的小瑕疵成为致命机关。",
    motive: "主演准备在首演夜公开解约并举报账务造假，乔蔓既要保住赞助，也要拿到事故赔付。",
    coverUp: "她把所有异常包装成舞台机械事故，再把替角压力和机械师疏忽推到台前。",
  },
  accusation: {
    requiredClueIds: ["jammed-bolt", "cue-sheet-rewrite", "missing-rose"],
    suspectEvidenceMap: {
      nova: ["missing-rose"],
      shade: ["jammed-bolt", "trapdoor-scuff"],
      echo: ["cue-sheet-rewrite", "rehearsal-audio"],
      iris: ["cue-sheet-rewrite", "missing-rose", "sponsor-rider", "rehearsal-audio"],
    },
    successArchiveLines: ["舞台事故伪装已解除。", "保险欺诈链路锁定。", "白鹭剧院案件归档完成。"],
    failureArchiveLines: ["终幕真相被再次遮蔽。", "错误嫌疑人引发封馆争议。", "白鹭剧院案件结算失败。"],
  },
  npcs: theaterNpcs,
  clues: theaterClues,
  initialConversations: {
    nova: [
      systemMessage("theater-sys-nova-1", "苏弦坚持主演出事前状态不对。", "18:22"),
      npcMessage(
        "theater-nova-1",
        "nova",
        "林惟安上台前拿过一支不属于她的白玫瑰。她闻了一下就皱眉，但没来得及换掉。",
        "18:24",
        ["missing-rose"],
      ),
    ],
    shade: [
      systemMessage("theater-sys-shade-1", "梁策正在检修终幕升降装置。", "18:20"),
      npcMessage(
        "theater-shade-1",
        "shade",
        "保险栓理论上不可能自己卡住。要么有人提前动过它，要么就是有人知道哪个小问题足够骗过例检。",
        "18:21",
        ["jammed-bolt"],
      ),
    ],
    echo: [
      systemMessage("theater-sys-echo-1", "白鹭-3 请求恢复被删减的 cue 日志。", "18:18"),
      npcMessage(
        "theater-echo-1",
        "echo",
        "终幕追光曾被手动延长 17 秒。那 17 秒正好足够让观众看不见升降台后侧。",
        "18:19",
      ),
    ],
    iris: [
      systemMessage("theater-sys-iris-1", "乔蔓要求你注意言辞，不要影响保险索赔。", "18:16"),
      npcMessage(
        "theater-iris-1",
        "iris",
        "首演出事对谁都没好处。你要是想把一次舞台事故硬说成谋杀，最好拿出比流言更硬的东西。",
        "18:17",
      ),
    ],
  },
  scriptedReplies: {
    nova: [
      npcMessage(
        "theater-nova-r1",
        "nova",
        "那支玫瑰本该由道具师直接交给主演，可真正递给她的人绕过了后台流程。",
        "18:28",
        ["missing-rose"],
      ),
      npcMessage(
        "theater-nova-r2",
        "nova",
        "如果林惟安真的在首演后解约，下一个顶上主角的人大概会是我，但我不需要靠一具尸体换角色。",
        "18:31",
      ),
      npcMessage(
        "theater-nova-r3",
        "nova",
        "她彩排时一直咳，像吸进去什么刺激气味，可大家都以为那只是舞台烟。",
        "18:35",
      ),
    ],
    shade: [
      npcMessage(
        "theater-shade-r1",
        "shade",
        "保险栓里那片薄铜不是维修件，像从赞助展板背后的装饰片上剪下来的。",
        "18:27",
        ["trapdoor-scuff"],
      ),
      npcMessage(
        "theater-shade-r2",
        "shade",
        "暗门轨道的擦痕是新鲜的，说明有人在谢幕前后从那里进入过升降台后侧。",
        "18:30",
        ["trapdoor-scuff"],
      ),
      npcMessage(
        "theater-shade-r3",
        "shade",
        "真正懂舞台的人知道，追光一旦被拉住，所有人的眼睛都会跟着灯走。",
        "18:34",
      ),
    ],
    echo: [
      npcMessage(
        "theater-echo-r1",
        "echo",
        "cue 表是从制作人终端重写的，但提交时用了通用运维口令，像是在故意模糊责任归属。",
        "18:29",
        ["cue-sheet-rewrite"],
      ),
      npcMessage(
        "theater-echo-r2",
        "echo",
        "我恢复到一段彩排录音: 有人说过'你要是今晚开口，大家都会完蛋'。",
        "18:33",
        ["rehearsal-audio"],
      ),
      npcMessage(
        "theater-echo-r3",
        "echo",
        "追光路径被延长后，观众席和监控都看不到后侧暗门，只有灯控总台能同时知道这两个盲区。",
        "18:37",
      ),
    ],
    iris: [
      npcMessage(
        "theater-iris-r1",
        "iris",
        "赞助条款是资本方要求的，不是我写来害人的。可如果主演真打算毁约，赔付确实会先落到项目账户。",
        "18:32",
        ["sponsor-rider"],
      ),
      npcMessage(
        "theater-iris-r2",
        "iris",
        "林惟安最近情绪很不稳定，她总说有人拿账本压她。你应该查她为什么突然要毁掉首演。",
        "18:36",
      ),
      npcMessage(
        "theater-iris-r3",
        "iris",
        "别把所有巧合都拼成阴谋。有时候一场戏砸了，只是因为太多人都想站到聚光灯里。",
        "18:40",
      ),
    ],
  },
  suggestedPrompts: {
    nova: ["那支白玫瑰是谁递给主演的？", "你为什么确信她上台前状态异常？", "替角压力对你意味着什么？"],
    shade: ["保险栓为什么会卡死？", "暗门轨道的新擦痕说明了什么？", "谁最了解如何制造舞台盲区？"],
    echo: ["cue 表是谁重写的？", "被恢复的彩排录音里到底说了什么？", "追光延长能遮住哪些视角？"],
    iris: ["赞助附加条款为什么这么致命？", "主演为什么突然要毁约？", "你为什么一开始就强调保险索赔？"],
  },
});

const trainCaseFile: CaseMeta = {
  id: "case-snowline-train-v1",
  title: "雪线列车失踪案",
  phase: "阶段 01 / 案件简报",
  district: "北岭雪线",
  threatLevel: "高压",
  briefing: "暴雪夜，越岭列车穿越长隧道时一名能源工程师离奇失踪，列车却显示所有舱门都未曾开启。",
  objective: "调查停电、舱门日志与乘客名单差异，找出是谁在封闭列车上完成了转移与灭口。",
  brief: {
    playerRole: "你是铁路应急调查员，必须在列车抵达终点站前锁定嫌疑人。",
    victim: {
      name: "周适",
      identity: "高寒能源项目工程师",
      summary: "周适在列车进入雪线最长隧道后失联，座位区只留下血迹和一枚断裂的储能芯片外壳。",
    },
    background: "这趟列车搭载的乘客不多，却混入了与北岭地下能源黑市有关的人。",
    currentSuspects: ["程岚", "韩渡", "CAR-09", "林越"],
    investigationDirections: [
      "追查隧道停电前后的列车中控日志",
      "核对乘客名单与被调换的车厢权限",
      "确认储能芯片交易是否与失踪有关",
    ],
  },
  worldBackground: "暴雪、低压和长隧道把所有人困在同一条铁轨上，每一次停靠都可能只是更深的伪装。",
  relationshipMap: [
    "程岚是乘务长，能调动车厢权限和应急通道。",
    "韩渡是地质顾问，实际与高寒能源项目的黑市样品有关联。",
    "CAR-09 管理车厢门锁、氧气和照明，是唯一记录全部时序的中控系统。",
    "林越是项目投资人，既担心项目泄密，也害怕名单外的人被查出来。",
  ],
};

const trainNpcs: Npc[] = [
  {
    id: "nova",
    name: "程岚",
    role: "乘务长",
    status: "guarded",
    trustLevel: 55,
    accentColor: "#8EDBFF",
    tagline: "她维护秩序，但也最清楚哪扇门什么时候能被打开。",
    investigationFocus: "车厢权限、应急舱门和隧道停电后的调度。",
    avatarSeed: "nova",
  },
  {
    id: "shade",
    name: "韩渡",
    role: "地质顾问",
    status: "suspect",
    trustLevel: 34,
    accentColor: "#FFBD72",
    tagline: "他比所有人都更关心那枚失踪的芯片。",
    investigationFocus: "储能样品、隧道路线和假身份登车问题。",
    avatarSeed: "shade",
  },
  {
    id: "echo",
    name: "CAR-09",
    role: "列车中控",
    status: "online",
    trustLevel: 69,
    accentColor: "#A4F2C8",
    tagline: "它没有偏见，但它的日志会被人截断。",
    investigationFocus: "门锁状态、氧气记录和黑屏时段。",
    avatarSeed: "echo",
  },
  {
    id: "iris",
    name: "林越",
    role: "项目投资人",
    status: "guarded",
    trustLevel: 41,
    accentColor: "#EFB2FF",
    tagline: "她需要这趟列车准时抵达，也需要某些人永远闭嘴。",
    investigationFocus: "投资协议、样品归属和乘客名单异常。",
    avatarSeed: "iris",
  },
];

const trainClues: Clue[] = [
  {
    id: "blackout-window",
    title: "隧道黑屏窗口",
    summary: "列车在进入主隧道后出现 84 秒黑屏窗口，中控门锁记录被整段擦除。",
    category: "系统异常",
    sourceNpcId: "echo",
    status: "unlocked",
  },
  {
    id: "manual-brake",
    title: "手动制动痕迹",
    summary: "3 号连接处出现手动制动擦痕，说明有人在黑屏期间迫使列车短暂减速。",
    category: "机械痕迹",
    sourceNpcId: "nova",
    status: "locked",
  },
  {
    id: "ghost-passenger",
    title: "名单外乘客编码",
    summary: "被删除的扫码缓存里还有第五张高级车厢临时权限码，未登记在正式名单中。",
    category: "乘客记录",
    sourceNpcId: "iris",
    status: "locked",
  },
  {
    id: "oxygen-dip",
    title: "氧气舱压短降",
    summary: "周适失联前 2 分钟，行李舱附近氧气舱压短暂下降，像有人打开过检修舱。",
    category: "环境记录",
    sourceNpcId: "echo",
    status: "locked",
  },
  {
    id: "core-shell",
    title: "断裂芯片外壳",
    summary: "现场芯片外壳是劣质仿制件，真正的高寒储能芯片已被人掉包带走。",
    category: "物证分析",
    sourceNpcId: "shade",
    status: "locked",
  },
  {
    id: "hatch-residue",
    title: "检修舱门冰屑",
    summary: "车尾检修舱门缝有新鲜冰屑和绳索纤维，说明有人利用隧道减速完成外侧转移。",
    category: "现场痕迹",
    sourceNpcId: "nova",
    status: "locked",
  },
];

const trainCase = createCase({
  id: trainCaseFile.id,
  categoryId: "closed-space",
  difficulty: "中高",
  estimatedMinutes: 30,
  selectionSummary: "暴雪列车上的封闭空间案件，节奏更紧，重在时序和转移动线。",
  tags: ["列车", "暴雪", "封闭空间"],
  remoteSupport: false,
  caseFile: trainCaseFile,
  truth: {
    culpritId: "shade",
    summary: "韩渡伪装成顾问随车，趁隧道黑屏时掉包芯片并逼迫周适进入检修舱，再利用短暂停车与外侧绳索转移尸体和真芯片。",
    motive: "他原本就在为地下能源买家寻找样品，周适临时反悔并准备报警，让交易彻底失控。",
    coverUp: "韩渡借中控黑屏、名单外权限码和投资人身份冲突，把注意力引向乘务系统和项目高层。",
  },
  accusation: {
    requiredClueIds: ["blackout-window", "manual-brake", "core-shell"],
    suspectEvidenceMap: {
      nova: ["manual-brake", "hatch-residue"],
      shade: ["manual-brake", "core-shell", "hatch-residue"],
      echo: ["blackout-window", "oxygen-dip"],
      iris: ["ghost-passenger"],
    },
    successArchiveLines: ["隧道黑屏时序已恢复。", "样品掉包链闭合。", "雪线列车案件归档完成。"],
    failureArchiveLines: ["列车已到终点。", "错误指控放跑关键买家。", "雪线列车案件结算失败。"],
  },
  npcs: trainNpcs,
  clues: trainClues,
  initialConversations: {
    nova: [
      systemMessage("train-sys-nova-1", "程岚提交了首份乘务异常报告。", "23:41"),
      npcMessage(
        "train-nova-1",
        "nova",
        "黑屏结束后，我在 3 号连接处看到制动擦痕。那不是系统自动减速会留下的痕迹。",
        "23:43",
      ),
    ],
    shade: [
      systemMessage("train-sys-shade-1", "韩渡坚持自己只是被卷入的顾问。", "23:39"),
      npcMessage(
        "train-shade-1",
        "shade",
        "周适手里的芯片不值一条命，除非有人相信那东西足够让整条雪线停摆。",
        "23:40",
      ),
    ],
    echo: [
      systemMessage("train-sys-echo-1", "CAR-09 正在尝试恢复黑屏日志。", "23:36"),
      npcMessage(
        "train-echo-1",
        "echo",
        "我确认存在 84 秒整段日志缺失。那不是自然故障，更像一次有预谋的维护级擦除。",
        "23:37",
        ["blackout-window"],
      ),
    ],
    iris: [
      systemMessage("train-sys-iris-1", "林越要求你不要惊动普通乘客。", "23:33"),
      npcMessage(
        "train-iris-1",
        "iris",
        "名单出错很常见，项目包厢临时加人也不奇怪。真正奇怪的是，周适为什么非要在上车后才决定改口。",
        "23:35",
      ),
    ],
  },
  scriptedReplies: {
    nova: [
      npcMessage(
        "train-nova-r1",
        "nova",
        "那道制动擦痕只可能来自人工拉杆，有人故意让列车在隧道里短暂停过一下。",
        "23:46",
        ["manual-brake"],
      ),
      npcMessage(
        "train-nova-r2",
        "nova",
        "车尾检修舱门缝里有冰屑和纤维，像有人在高速冷风里匆忙收过一条绳。",
        "23:50",
        ["hatch-residue"],
      ),
      npcMessage(
        "train-nova-r3",
        "nova",
        "如果不是熟悉车厢结构的人，不会知道在哪一段减速最不容易让乘客察觉。",
        "23:54",
      ),
    ],
    shade: [
      npcMessage(
        "train-shade-r1",
        "shade",
        "你在座位区捡到的外壳只是仿制件，真正那枚高寒芯片不会这么脆，也不会留下这种廉价合金边。",
        "23:47",
        ["core-shell"],
      ),
      npcMessage(
        "train-shade-r2",
        "shade",
        "周适上车前明明说好交样，进了隧道却突然要见调查员。有人一改口，所有人都会跟着出事。",
        "23:52",
      ),
      npcMessage(
        "train-shade-r3",
        "shade",
        "名单外的人不一定是杀手，也可能只是买家派来的眼睛。你最好先想清楚谁最怕样品被验真。",
        "23:56",
      ),
    ],
    echo: [
      npcMessage(
        "train-echo-r1",
        "echo",
        "黑屏前后行李舱氧气舱压下降 6%，这意味着检修区域曾被短时开启。",
        "23:48",
        ["oxygen-dip"],
      ),
      npcMessage(
        "train-echo-r2",
        "echo",
        "门锁擦除日志使用了维护级权限，但发起端并不在驾驶室，而在 3 号连接处的临时检修口。",
        "23:53",
      ),
      npcMessage(
        "train-echo-r3",
        "echo",
        "如果你把黑屏、舱压和减速放在同一时间线上，会发现它们像是为一次转移配合好的三步。",
        "23:58",
      ),
    ],
    iris: [
      npcMessage(
        "train-iris-r1",
        "iris",
        "缓存里那张临时权限码确实不在正式名单里，但开码的人不是我，是项目安保外包接口。",
        "23:49",
        ["ghost-passenger"],
      ),
      npcMessage(
        "train-iris-r2",
        "iris",
        "周适不是第一次拿样品要价，他只是第一次在列车上改主意。谁和他一起进了隧道，谁就最怕他活着下车。",
        "23:55",
      ),
      npcMessage(
        "train-iris-r3",
        "iris",
        "你若想怀疑投资人，就先解释为什么真正的芯片会被掉包。那更像买家逻辑，不像董事会逻辑。",
        "23:59",
      ),
    ],
  },
  suggestedPrompts: {
    nova: ["手动制动痕迹说明了什么？", "检修舱门冰屑从哪里来的？", "谁最熟悉车厢减速窗口？"],
    shade: ["断裂外壳为什么是仿制件？", "周适为什么会在隧道里突然改口？", "谁最需要真正的芯片样品？"],
    echo: ["84 秒黑屏是怎么被擦掉的？", "氧气舱压短降意味着什么？", "黑屏、减速和门锁擦除怎样串起来？"],
    iris: ["名单外权限码是谁开的？", "谁最怕周适活着下车？", "为什么你一直强调是交易逻辑而不是董事会逻辑？"],
  },
});

export const caseCategories: CaseCategory[] = [
  {
    id: "all",
    label: "全部剧本",
    description: "浏览全部可玩的推理案件。",
  },
  {
    id: "cyber-conspiracy",
    label: "赛博阴谋",
    description: "企业、AI 与高压权限斗争。",
  },
  {
    id: "social-mystery",
    label: "社会派",
    description: "利益、家族与现实动机。",
  },
  {
    id: "locked-room",
    label: "本格密室",
    description: "机关、伪意外和空间诡计。",
  },
  {
    id: "closed-space",
    label: "封闭空间",
    description: "列车、暴雪与时序追查。",
  },
];

export const caseLibrary: CaseDefinition[] = [
  defaultCase,
  mistHarborCase,
  theaterCase,
  trainCase,
];

export const defaultCaseId = defaultCase.id;

export const caseLibraryById = Object.fromEntries(
  caseLibrary.map((caseDefinition) => [caseDefinition.id, caseDefinition]),
) as Record<string, CaseDefinition>;
