import type { ChatMessage, Npc } from "../types/game";
import { NpcAvatar } from "../assets/npc/NpcAvatar";
import { PanelFrame } from "./PanelFrame";

const statusLabel: Record<Npc["status"], string> = {
  online: "在线",
  guarded: "戒备",
  suspect: "嫌疑",
  offline: "离线",
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
      title="对象网络"
      subtitle="在嫌疑人、目击者与线人之间切换，先确认他们各自掌握哪一段案情。"
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
              className={`group relative w-full overflow-hidden rounded-[26px] border px-4 py-4 text-left transition-all duration-300 ${
                isActive
                  ? "border-white/15 bg-[rgba(142,178,193,0.08)] shadow-[0_10px_24px_rgba(7,12,20,0.16)]"
                  : "border-white/8 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
              }`}
              style={{
                boxShadow: isActive ? `0 0 20px ${npc.accentColor}15, 0 10px 24px rgba(7,12,20,0.16)` : undefined,
              }}
            >
              {/* 顶部光效 */}
              <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${npc.accentColor}, transparent)`,
                  opacity: isActive ? 0.8 : 0.3,
                }}
              />

              <div className="flex items-start gap-3">
                {/* 头像 */}
                <div className="relative shrink-0">
                  <NpcAvatar npc={npc} size="md" showRing={isActive} showGlow={isActive} />
                </div>

                <div className="min-w-0 flex-1">
                  {/* 名称和状态 */}
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
                      className="shrink-0 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.2em] transition-colors"
                      style={{
                        borderColor: isActive ? `${npc.accentColor}70` : `${npc.accentColor}40`,
                        color: npc.accentColor,
                        background: isActive ? `${npc.accentColor}15` : `${npc.accentColor}08`,
                      }}
                    >
                      {statusLabel[npc.status]}
                    </span>
                  </div>

                  {/* 签名语 */}
                  <p className="mt-2.5 line-clamp-2 text-[0.8rem] leading-5 text-[#D7DEE7]">
                    {npc.tagline}
                  </p>

                  {/* 信任度 */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${npc.trustLevel}%`,
                          background: `linear-gradient(90deg, ${npc.accentColor}, ${npc.accentColor}aa)`,
                        }}
                      />
                    </div>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#AEB8C5]">
                      T{npc.trustLevel}
                    </span>
                  </div>

                  {/* 最新消息 */}
                  <p className="mt-2.5 truncate text-[0.68rem] uppercase tracking-[0.16em] text-[#96A3B3]">
                    {latestMessage?.speakerType === "player"
                      ? "你："
                      : latestMessage?.speakerType === "npc"
                        ? "讯号："
                        : "系统："}
                    {latestMessage?.text ?? "暂无讯号"}
                  </p>
                </div>
              </div>

              {/* 选中指示器 */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40"
                  style={{ background: `linear-gradient(90deg, transparent, ${npc.accentColor}, transparent)` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </PanelFrame>
  );
}
