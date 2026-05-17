import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { ChatMessage, Npc } from "../types/game";
import { PanelFrame } from "./PanelFrame";

interface ChatWindowProps {
  activeNpc: Npc;
  messages: ChatMessage[];
  footer?: ReactNode;
}

export function ChatWindow({ activeNpc, messages, footer }: ChatWindowProps) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousFeedStateRef = useRef<{ npcId: string; messageCount: number } | null>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const previousFeedState = previousFeedStateRef.current;
    const currentFeedState = { npcId: activeNpc.id, messageCount: messages.length };

    if (!container || !previousFeedState) {
      previousFeedStateRef.current = currentFeedState;
      return;
    }

    if (
      previousFeedState.npcId === activeNpc.id &&
      currentFeedState.messageCount > previousFeedState.messageCount
    ) {
      container.scrollTop = container.scrollHeight;
    }

    previousFeedStateRef.current = currentFeedState;
  }, [messages.length, activeNpc.id]);

  return (
    <PanelFrame
      title="Interrogation Feed"
      className="chat-panel flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="cyber-card mb-4 shrink-0 rounded-[24px] px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#AEB8C5]">
                Current Subject
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div
                  className="h-2.5 w-2.5 animate-pulse rounded-full"
                  style={{ backgroundColor: activeNpc.accentColor }}
                />
                <p className="text-[1.08rem] font-semibold tracking-[0.015em] text-[#E2E8F0] sm:text-[1.2rem]">
                  {activeNpc.name}
                </p>
                <span className="terminal-pill rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em]">
                  {activeNpc.role}
                </span>
              </div>
            </div>

            <div
              className="rounded-[20px] border px-3 py-2"
              style={{
                borderColor: `${activeNpc.accentColor}40`,
                background: `linear-gradient(180deg, ${activeNpc.accentColor}16, rgba(255,255,255,0.03))`,
              }}
            >
              <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#B8C2CF]">Status</p>
              <p className="mt-1 text-sm font-medium uppercase text-[#E2E8F0]">
                {activeNpc.status}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">Focus</p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
                {activeNpc.investigationFocus}
              </p>
            </div>

            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Case Note
              </p>
              <p className="mt-2 text-sm leading-6 text-[#AEB8C5]">{activeNpc.tagline}</p>
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="chat-feed flex-1 min-h-0 overflow-y-auto rounded-[24px] pr-1"
        >
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
                      <span>{isPlayer ? "You" : isSystem ? "System" : activeNpc.name}</span>
                      <span className="text-[#96A3B3]">{message.timestamp}</span>
                    </div>
                    <p className="text-[0.96rem] leading-7">{message.text}</p>
                    {message.unlockClueIds?.length ? (
                      <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-2.5 text-xs leading-5 text-[#D6DEEA]">
                        Clue sync: {message.unlockClueIds.length} new evidence item(s) added to
                        the case file.
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {footer ? <div className="mt-3 shrink-0">{footer}</div> : null}
      </div>
    </PanelFrame>
  );
}
