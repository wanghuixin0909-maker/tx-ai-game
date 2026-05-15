import type { ChatMessage, Npc } from "../types/game";
import { NpcAvatar } from "../assets/npc/NpcAvatar";
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
      subtitle="在嫌疑人、目击者与线人之间切换，先确认他们各自掌握哪一段案情。"
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="scroll-primary min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {npcs.map((npc) => {
          const latestMessage = conversations[npc.id]?.at(-1);
          const isActive = npc.id === selectedNpcId;

          return (
            <button
              key={npc.id}
              type="button"
              onClick={() => onSelect(npc.id)}
              className={`group cyber-card relative flex h-[130px] w-full flex-col overflow-hidden rounded-[26px] px-4 py-3 text-left transition duration-300 ${
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
              <div className="flex h-full gap-3">
              <NpcAvatar npc={npc} size="md" showRing={isActive} />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[0.92rem] font-semibold text-slate-50">
                        {npc.name}
                      </h3>
                      <p className="truncate text-[0.68rem] tracking-[0.06em] text-[#AEB8C5]">
                        {npc.role}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full border px-2 py-0.5 text-[0.58rem] font-medium tracking-[0.2em]"
                      style={{
                        borderColor: `${npc.accentColor}55`,
                        color: npc.accentColor,
                        background: `${npc.accentColor}10`,
                      }}
                    >
                      {statusLabel[npc.status]}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${npc.trustLevel}%`,
                            background: `linear-gradient(90deg, ${npc.accentColor}, #ffffff)`,
                          }}
                        />
                      </div>
                      <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                        T{npc.trustLevel}
                      </span>
                    </div>
                    <p className="truncate text-[0.65rem] uppercase tracking-[0.12em] text-[#AEB8C5]">
                      {latestMessage?.speakerType === "player"
                        ? "You: "
                        : latestMessage?.speakerType === "npc"
                          ? "Signal: "
                          : "System: "}
                      {latestMessage?.text ?? "No signal"}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </PanelFrame>
  );
}
