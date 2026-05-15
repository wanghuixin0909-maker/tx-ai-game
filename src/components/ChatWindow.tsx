import { useEffect, useRef } from "react";
import type { ChatMessage, Npc } from "../types/game";
import { NpcIdentityCard } from "../assets/npc/NpcAvatar";

interface ChatWindowProps {
  activeNpc: Npc;
  messages: ChatMessage[];
}

export function ChatWindow({ activeNpc, messages }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeNpc.id]);

  return (
    <section className="cyber-panel chat-panel flex h-full flex-col p-3 sm:p-5">
      <div className="mb-4 shrink-0 space-y-3">
        <NpcIdentityCard npc={activeNpc} />

        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
              Interrogation Focus
            </p>
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{activeNpc.investigationFocus}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
              Profile Note
            </p>
            <p className="mt-2 text-sm leading-6 text-[#AEB8C5]">{activeNpc.tagline}</p>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="chat-feed scroll-primary min-h-0 flex-1 overflow-y-auto rounded-[24px] pr-1"
      >
        <div className="space-y-5 py-2">
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
    </section>
  );
}
