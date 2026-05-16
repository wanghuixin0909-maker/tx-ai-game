import { useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import type { ChatMessage, Npc } from "../types/game";
import { NpcAvatar } from "../assets/npc/NpcAvatar";
import { PanelFrame } from "./PanelFrame";

interface ChatWindowProps {
  activeNpc: Npc;
  messages: ChatMessage[];
}

const MESSAGE_BASE_HEIGHT = 100;
const CLUE_BANNER_HEIGHT = 60;
const GAP_BETWEEN_MESSAGES = 20;

interface MessageItem {
  id: string;
  height: number;
  isPlayer: boolean;
  isSystem: boolean;
  speaker: string;
  timestamp: string;
  text: string;
  hasClueBanner: boolean;
  accentColor: string;
}

/** 计算单条消息的渲染高度 */
function calcMessageHeight(message: ChatMessage): number {
  const baseHeight = MESSAGE_BASE_HEIGHT;
  // 文本行数估算（中文约 22 字/行，英文约 40 字/行）
  const charCount = message.text.replace(/[\u4e00-\u9fa5]/g, "xx").length;
  const lines = Math.ceil(charCount / 28);
  const textHeight = Math.max(28, lines * 28);
  const clueBanner = message.unlockClueIds?.length ? CLUE_BANNER_HEIGHT : 0;

  return baseHeight + textHeight + clueBanner + GAP_BETWEEN_MESSAGES;
}

/** 将 ChatMessage 数组转换为虚拟列表需要的格式 */
function buildMessageItems(
  messages: ChatMessage[],
  activeNpc: Npc,
): MessageItem[] {
  return messages.map((message) => {
    const isPlayer = message.speakerType === "player";
    const isSystem = message.speakerType === "system";

    return {
      id: message.id,
      height: calcMessageHeight(message),
      isPlayer,
      isSystem,
      speaker: isPlayer ? "Player" : isSystem ? "System" : activeNpc.name,
      timestamp: message.timestamp,
      text: message.text,
      hasClueBanner: !!message.unlockClueIds?.length,
      accentColor: activeNpc.accentColor,
    };
  });
}

/** 虚拟列表行组件 */
const MessageRow = ({ index, style, data }: ListChildComponentProps<{ items: MessageItem[] }>) => {
  const item = data.items[index];

  return (
    <div style={style}>
      <article
        className={`flex ${item.isPlayer ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[88%] rounded-[26px] border px-4 py-3.5 sm:max-w-[78%] ${
            item.isPlayer
              ? "border-white/10 bg-[rgba(167,181,200,0.1)] text-[#E2E8F0] shadow-[0_10px_22px_rgba(9,14,24,0.14)]"
              : item.isSystem
                ? "border-white/8 bg-white/[0.06] text-[#D6DEEA]"
                : "border-white/8 bg-[rgba(136,145,171,0.08)] text-[#E2E8F0] shadow-[0_10px_22px_rgba(9,14,24,0.12)]"
          }`}
        >
          <div className="mb-2.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#B8C2CF]">
            <span>{item.speaker}</span>
            <span className="text-[#96A3B3]">{item.timestamp}</span>
          </div>
          <p className="text-[0.96rem] leading-7">{item.text}</p>
          {item.hasClueBanner && (
            <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-2.5 text-xs leading-5 text-[#D6DEEA]">
              线索同步: 新证据已加入案卷。
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export function ChatWindow({ activeNpc, messages }: ChatWindowProps) {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);
  const [listHeight, setListHeight] = useState(400);

  // 构建虚拟列表数据
  const items = buildMessageItems(messages, activeNpc);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setListHeight(container.clientHeight);
    };

    // 初始高度
    updateHeight();

    // 监听大小变化
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // 检测是否在底部附近
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 80;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // 滚动到底部
  useEffect(() => {
    const currentMessageCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (currentMessageCount > prevCount) {
      // 有新消息
      if (isAtBottomRef.current || currentMessageCount <= 20) {
        // 用户在底部或消息较少，滚动到底部
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem(items.length - 1, { align: "end" });
        });
      }
    }

    prevMessageCountRef.current = currentMessageCount;
  }, [messages.length]);

  // 监听滚动位置
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  return (
    <PanelFrame
      title="Interrogation Feed"
      className="chat-panel flex h-full min-h-[26rem] flex-col p-4 sm:min-h-[30rem] sm:p-5"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* 身份卡片头部 — 固定不滚动 */}
        <div
          className="shrink-0 rounded-[24px] border px-4 py-3.5 sm:px-5"
          style={{
            borderColor: `${activeNpc.accentColor}30`,
            background: `linear-gradient(135deg, ${activeNpc.accentColor}08, rgba(255,255,255,0.02))`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* 头像 */}
            <NpcAvatar npc={activeNpc} size="xl" showRing={true} showGlow={true} />

            {/* 身份信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  className="text-[1.15rem] font-bold tracking-[0.02em]"
                  style={{ color: activeNpc.accentColor }}
                >
                  {activeNpc.name}
                </h2>
                <span className="terminal-pill rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em]">
                  {activeNpc.role}
                </span>
                <span
                  className="rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em]"
                  style={{
                    borderColor: `${activeNpc.accentColor}50`,
                    color: activeNpc.accentColor,
                  }}
                >
                  T{activeNpc.trustLevel}
                </span>
              </div>

              <p className="mt-2 text-sm leading-5 text-[#D6DEEA]">
                {activeNpc.investigationFocus}
              </p>
            </div>

            {/* 状态 */}
            <div
              className="hidden shrink-0 rounded-[20px] border px-3 py-2 sm:block"
              style={{
                borderColor: `${activeNpc.accentColor}40`,
                background: `linear-gradient(180deg, ${activeNpc.accentColor}12, rgba(255,255,255,0.02))`,
              }}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[#B8C2CF]">
                Status
              </p>
              <p className="mt-1 text-sm font-medium uppercase" style={{ color: activeNpc.accentColor }}>
                {activeNpc.status}
              </p>
            </div>
          </div>

          {/* 签名语 */}
          <p className="mt-3 text-[0.78rem] leading-5 text-[#AEB8C5]">
            {activeNpc.tagline}
          </p>
        </div>

        {/* 消息列表 — 虚拟化滚动 */}
        <div
          ref={containerRef}
          className="chat-feed min-h-0 flex-1 rounded-[24px] pr-1"
          onScroll={handleScroll}
        >
          {items.length > 0 ? (
            <List
              ref={listRef}
              height={listHeight}
              width="100%"
              itemCount={items.length}
              itemSize={(index: number) => items[index]?.height ?? MESSAGE_BASE_HEIGHT}
              itemData={{ items }}
              overscanCount={5}
            >
              {MessageRow}
            </List>
          ) : (
            <div className="flex h-full items-center justify-center text-[#B8C2CF]">
              开始对话...
            </div>
          )}
        </div>

        {/* 底部锚点 */}
        <div ref={bottomRef} />
      </div>
    </PanelFrame>
  );
}
