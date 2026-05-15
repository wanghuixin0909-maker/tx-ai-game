import { useEffect, useRef } from "react";
import type { CaseMeta, ChatMessage, Npc } from "../types/game";
import { CaseBriefCard } from "./CaseBriefCard";
import { PanelFrame } from "./PanelFrame";

interface ChatWindowProps {
  caseFile: CaseMeta;
  activeNpc: Npc;
  messages: ChatMessage[];
  progressLabel: string;
}

export function ChatWindow({
  caseFile,
  activeNpc,
  messages,
  progressLabel,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeNpc.id]);

  return (
    <PanelFrame
      title="Interrogation Feed"
      subtitle={caseFile.briefing}
      className="chat-panel flex h-full min-h-[32rem] flex-col p-5 sm:p-6"
      action={
        <div className="terminal-pill hidden rounded-full px-3.5 py-2.5 text-right text-[0.65rem] uppercase tracking-[0.24em] text-[#D6DEEA] sm:block">
          <p>{caseFile.phase}</p>
          <p className="mt-1 text-[0.62rem] text-[#B8C2CF]">{progressLabel}</p>
        </div>
      }
    >
      <div className="cyber-card mb-5 rounded-[28px] px-5 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[1.15rem] font-semibold tracking-[0.03em] text-[#E2E8F0] sm:text-[1.24rem]">
            {caseFile.title}
          </p>
          <span className="rounded-full border border-white/8 bg-white/[0.06] px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-[#D6DEEA]">
            Threat {caseFile.threatLevel}
          </span>
          <span className="terminal-pill rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-slate-100">
            {caseFile.district}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-[#D6DEEA]">
          {caseFile.briefing}
        </p>
        <div className="mt-5">
          <CaseBriefCard caseFile={caseFile} mode="compact" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3.5">
          <div
            className="cyber-card flex items-center gap-3 rounded-[22px] px-3.5 py-3"
            style={{
              borderColor: `${activeNpc.accentColor}55`,
              background: `linear-gradient(180deg, ${activeNpc.accentColor}16, ${activeNpc.accentColor}0d)`,
            }}
          >
            <div
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeNpc.accentColor }}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#B8C2CF]">
                Active Channel
              </p>
              <p className="mt-1 text-sm font-medium text-[#E2E8F0]">
                {activeNpc.name} / {activeNpc.role}
              </p>
            </div>
          </div>
          <div className="cyber-card rounded-[22px] px-3.5 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#B8C2CF]">
              审问焦点
            </p>
            <p className="mt-1 text-sm leading-6 text-[#D6DEEA]">{activeNpc.investigationFocus}</p>
            <p className="mt-2 text-sm leading-6 text-[#AEB8C5]">{activeNpc.tagline}</p>
          </div>
        </div>
      </div>
      <div className="chat-feed flex-1 overflow-y-auto rounded-[24px] pr-1">
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
                  <div className="mb-2.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-[#B8C2CF]">
                    <span>
                      {isPlayer
                        ? "Player"
                        : isSystem
                          ? "System"
                          : activeNpc.name}
                    </span>
                    <span className="text-[#96A3B3]">{message.timestamp}</span>
                  </div>
                  <p className="text-[0.96rem] leading-7">{message.text}</p>
                  {message.unlockClueIds?.length ? (
                    <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-2.5 text-xs leading-5 text-[#D6DEEA]">
                      线索同步: {message.unlockClueIds.length} 条新证据已注入案件面板
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </PanelFrame>
  );
}
