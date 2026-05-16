import { useEffect, useRef } from "react";
import type { ChatMessage, Npc } from "../types/game";
import { NpcAvatar } from "../assets/npc/NpcAvatar";
import { PanelFrame } from "./PanelFrame";

interface ChatWindowProps {
  activeNpc: Npc;
  messages: ChatMessage[];
}

export function ChatWindow({ activeNpc, messages }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeNpc.id]);

  return (
    <PanelFrame
      title="Interrogation Feed"
      className="chat-panel flex h-full min-h-[26rem] flex-col p-4 sm:min-h-[30rem] sm:p-5"
    >
      <div className="flex flex-col gap-4 h-full">
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

        {/* 消息列表 — 独立滚动 */}
        <div className="chat-feed flex-1 min-h-0 overflow-y-auto rounded-[24px] pr-1">
          <div className="space-y-5">
            {messages.map((message) => {
              const isPlayer = message.speakerType === "player";
              const isSystem = message.speakerType === "system";

              return (
                <article
                  key={message.id}
                  className={`flex ${isPlayer ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-[26px] border px-4 py-3.5 sm:max-w-[78%] ${
                      isPlayer
                        ? "border-white/10 bg-[rgba(167,181,200,0.1)] text-[#E2E8F0] shadow-[0_10px_22px_rgba(9,14,24,0.14)]"
                        : isSystem
                          ? "border-white/8 bg-white/[0.06] text-[#D6DEEA]"
                          : "border-white/8 bg-[rgba(136,145,171,0.08)] text-[#E2E8F0] shadow-[0_10px_22px_rgba(9,14,24,0.12)]"
                    }`}
                  >
                    <div className="mb-2.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#B8C2CF]">
                      <span>{isPlayer ? "Player" : isSystem ? "System" : activeNpc.name}</span>
                      <span className="text-[#96A3B3]">{message.timestamp}</span>
                    </div>
                    <p className="text-[0.96rem] leading-7">{message.text}</p>
                    {message.unlockClueIds?.length ? (
                      <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-2.5 text-xs leading-5 text-[#D6DEEA]">
                        线索同步: {message.unlockClueIds.length} 条新证据已加入案卷。
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
