import type { ChatMessage, Npc } from "../types/game";
import { PanelFrame } from "./PanelFrame";

const statusLabel: Record<Npc["status"], string> = {
  online: "ONLINE",
  guarded: "GUARDED",
  suspect: "SUSPECT",
  offline: "OFFLINE",
};

interface NpcSidebarProps {
  npcs: Npc[];
  selectedNpcId: string;
  conversations: Record<string, ChatMessage[]>;
  onSelect: (npcId: string) => void;
}

export function NpcSidebar({
  npcs,
  selectedNpcId,
  conversations,
  onSelect,
}: NpcSidebarProps) {
  return (
    <PanelFrame
      title="Network Personas"
      subtitle="在嫌疑人、目击者与线人之间切换，读取他们的最新状态。"
      className="h-full min-h-[24rem] p-5 sm:p-6"
    >
      <div className="space-y-3.5">
        {npcs.map((npc) => {
          const latestMessage = conversations[npc.id]?.at(-1);
          const isActive = npc.id === selectedNpcId;

          return (
            <button
              key={npc.id}
              type="button"
              onClick={() => onSelect(npc.id)}
              className={`group cyber-card relative w-full overflow-hidden rounded-[26px] px-4 py-4 text-left transition duration-300 ${
                isActive
                  ? "border-white/10 bg-[rgba(142,178,193,0.08)] shadow-[0_10px_24px_rgba(7,12,20,0.16)]"
                  : "hover:border-white/10 hover:bg-white/[0.05] hover:shadow-[0_10px_24px_rgba(7,12,20,0.16)]"
              }`}
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-60"
                style={{
                  background: `linear-gradient(90deg, transparent, ${npc.accentColor}, transparent)`,
                }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold tracking-[0.25em]"
                  style={{
                    borderColor: `${npc.accentColor}66`,
                    color: npc.accentColor,
                    background: `${npc.accentColor}14`,
                    boxShadow: `0 0 12px ${npc.accentColor}14`,
                  }}
                >
                  {npc.avatarSeed}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="truncate text-[0.98rem] font-semibold text-slate-50">
                        {npc.name}
                      </h3>
                      <p className="mt-1 text-xs tracking-[0.08em] text-[#AEB8C5]">
                        {npc.role}
                      </p>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.24em]"
                      style={{
                        borderColor: `${npc.accentColor}55`,
                        color: npc.accentColor,
                        background: `${npc.accentColor}10`,
                      }}
                    >
                      {statusLabel[npc.status]}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[0.82rem] leading-6 text-[#D7DEE7]">
                    {npc.tagline}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${npc.trustLevel}%`,
                          background: `linear-gradient(90deg, ${npc.accentColor}, #ffffff)`,
                        }}
                      />
                    </div>
                    <span className="text-[0.65rem] uppercase tracking-[0.22em] text-[#AEB8C5]">
                      T{npc.trustLevel}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-[0.72rem] uppercase tracking-[0.2em] text-[#AEB8C5]">
                    {latestMessage?.speakerType === "player"
                      ? "You: "
                      : latestMessage?.speakerType === "npc"
                        ? "Signal: "
                        : "System: "}
                    {latestMessage?.text ?? "No signal"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </PanelFrame>
  );
}
