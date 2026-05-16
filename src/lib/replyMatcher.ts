import type { ChatMessage } from "../types/game";

/** 单个关键词规则 */
interface KeywordRule {
  keywords: string[];
  priority: number;
}

/** 关键词配置：每个回复索引对应一个或多个关键词 */
type KeywordPatterns = KeywordRule[];

/**
 * 从回复文本中提取关键词片段用于匹配
 * 支持中文和英文
 */
function extractKeywords(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[.,?!，。？！、；;:]/g, " ");
  const segments = normalized.split(/\s+/).filter((s) => s.length >= 2);
  const keywords: string[] = [];

  // 短词组（2-4字/词）
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.length <= 4) {
      keywords.push(seg);
    }
    // 组合相邻片段形成短语
    if (i + 1 < segments.length) {
      keywords.push(seg + segments[i + 1]);
    }
    if (i + 2 < segments.length) {
      keywords.push(seg + segments[i + 1] + segments[i + 2]);
    }
  }

  return [...new Set(keywords)];
}

/**
 * 检查玩家消息是否包含指定关键词
 */
function matchesKeywords(
  playerMessage: string,
  keywords: string[],
): boolean {
  const normalized = playerMessage.toLowerCase();
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

/**
 * 从 NPC 回复池构建关键词匹配索引
 */
export function buildKeywordIndex(
  replyPool: ChatMessage[],
): KeywordPatterns {
  return replyPool.map((reply, index) => ({
    keywords: extractKeywords(reply.text),
    priority: index, // 原始顺序作为默认优先级
  }));
}

/**
 * 从已发现的线索 ID 列表中提取关键词
 */
export function extractClueKeywords(discoveredClueIds: string[]): string[] {
  const clueKeywordMap: Record<string, string[]> = {
    "badge-scan": ["门禁", "复制", "刷卡", "凭证", "badge", "门卡", "克隆"],
    "ghost-proxy": ["流量", "中继", "清洗", "日志", "proxy", "痕迹", "洗"],
    "thermal-gap": ["热成像", "盲区", "缺失", "thermal", "12秒", "监控"],
    "vault-key": ["签名", "密钥", "离线", "vault", "key", "权限", "签名密钥"],
    "mirror-contract": ["合同", "镜像", "付款", "contract", "黑市", "代码"],
    "maintenance-route": ["巡逻", "改线", "维护", "route", "路线", "调度"],
  };

  const keywords: string[] = [];
  for (const clueId of discoveredClueIds) {
    const clueKw = clueKeywordMap[clueId];
    if (clueKw) {
      keywords.push(...clueKw);
    }
  }
  return keywords;
}

export interface MatchResult {
  matchedIndex: number;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * 关键词匹配核心函数
 * @param playerMessage 玩家输入的消息
 * @param keywordIndex 回复池的关键词索引
 * @param discoveredClueIds 已发现线索 ID 列表
 * @param recentlyMatchedIndices 最近已匹配的索引（避免重复）
 * @returns 匹配结果，null 表示无匹配
 */
export function matchByKeywords(
  playerMessage: string,
  keywordIndex: KeywordPatterns,
  discoveredClueIds: string[],
  recentlyMatchedIndices: Set<number> = new Set(),
): MatchResult | null {
  const clueKeywords = extractClueKeywords(discoveredClueIds);
  const allKeywords = [...clueKeywords];

  // 按优先级排序（先匹配高优先级回复）
  const sortedIndex = [...keywordIndex.entries()].sort(
    (a, b) => a[1].priority - b[1].priority,
  );

  let bestMatch: MatchResult | null = null;

  for (const [idx, rule] of sortedIndex) {
    // 跳过最近已匹配的回复
    if (recentlyMatchedIndices.has(idx)) continue;

    const matchedKws = rule.keywords.filter((kw) =>
      matchesKeywords(playerMessage, [kw]),
    );

    // 如果没有直接关键词匹配，但有线索关键词匹配，降低置信度
    if (matchedKws.length === 0 && allKeywords.length > 0) {
      const hasAnyClueMatch = allKeywords.some((ck) =>
        matchesKeywords(playerMessage, [ck]),
      );
      if (hasAnyClueMatch) {
        matchedKws.push("clue-context");
      }
    }

    if (matchedKws.length > 0) {
      const confidence = Math.min(matchedKws.length * 0.4, 0.95);

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          matchedIndex: idx,
          confidence,
          matchedKeywords: matchedKws,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * 智能选择回复
 * 优先关键词匹配，否则轮询未使用的回复
 */
export function selectReply(
  playerMessage: string,
  replyPool: ChatMessage[],
  keywordIndex: KeywordPatterns,
  discoveredClueIds: string[],
  usedIndices: Set<number>,
): { reply: ChatMessage; matchedIndex: number } | null {
  if (replyPool.length === 0) return null;

  // 构建最近匹配索引（用于避免连续重复）
  const recentIndices = new Set<number>();
  const usedArr = [...usedIndices];
  for (let i = Math.max(0, usedArr.length - 2); i < usedArr.length; i++) {
    recentIndices.add(usedArr[i]);
  }

  // 尝试关键词匹配
  const keywordMatch = matchByKeywords(
    playerMessage,
    keywordIndex,
    discoveredClueIds,
    recentIndices,
  );

  if (keywordMatch && !recentIndices.has(keywordMatch.matchedIndex)) {
    return {
      reply: replyPool[keywordMatch.matchedIndex],
      matchedIndex: keywordMatch.matchedIndex,
    };
  }

  // Fallback: 轮询未使用的回复
  const unusedIndices: number[] = [];
  for (let i = 0; i < replyPool.length; i++) {
    if (!usedIndices.has(i)) {
      unusedIndices.push(i);
    }
  }

  // 如果所有回复都用过了，重置并从第一个开始
  if (unusedIndices.length === 0) {
    const firstAvailable = usedIndices.size % replyPool.length;
    return {
      reply: replyPool[firstAvailable],
      matchedIndex: firstAvailable,
    };
  }

  // 从未使用的回复中随机选择（增加变化性）
  const randomIdx = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
  return {
    reply: replyPool[randomIdx],
    matchedIndex: randomIdx,
  };
}
