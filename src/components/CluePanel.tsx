import type { Clue, Npc } from "../types/game";
import { shouldShowNewBadge } from "../hooks/useClueUnlockAnimation";

interface CluePanelProps {
  clues: Clue[];
  activeNpc: Npc;
  discoveredClueIds: Set<string>;
  clueStates?: Record<string, { isNewlyUnlocked: boolean; showBadge: boolean }>;
}

export function CluePanel({
  clues,
  activeNpc,
  discoveredClueIds,
  clueStates = {},
}: CluePanelProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#AEB8C5]">
          Case Fragments
        </p>
        <div className="terminal-pill rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-[#D7DEE7]">
          {discoveredClueIds.size}/{clues.length} clues
        </div>
      </div>

      <div className="space-y-2.5">
        {clues.map((clue) => {
          const unlocked = discoveredClueIds.has(clue.id);
          const relatedToActiveNpc = clue.sourceNpcId === activeNpc.id;
          const clueState = clueStates[clue.id];
          const isNewlyUnlocked = clueState?.isNewlyUnlocked ?? false;
          const showBadge = shouldShowNewBadge(clue.id, clueStates);

          return (
            <article
              key={clue.id}
              className={`cyber-card rounded-[22px] p-3.5 transition duration-300 ${
                unlocked
                  ? relatedToActiveNpc
                    ? "border-white/10 bg-[rgba(142,178,193,0.08)] shadow-[0_10px_22px_rgba(7,12,20,0.14)]"
                    : "border-white/8 bg-[rgba(156,149,181,0.06)]"
                  : "border-dashed border-slate-300/10 bg-slate-100/[0.03]"
              } ${isNewlyUnlocked ? "clue-unlock-animate" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.96rem] font-semibold text-slate-50">{clue.title}</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.24em] text-[#AEB8C5]">
                    {clue.category}
                  </p>
                </div>
                {showBadge ? (
                  <span className="clue-new-badge rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.22em]">
                    NEW CLUE
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.22em] ${
                      unlocked
                        ? "border border-white/8 bg-white/[0.05] text-[#D7DEE7]"
                        : "border border-slate-300/10 bg-slate-100/[0.03] text-[#AEB8C5]"
                    }`}
                  >
                    {unlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                )}
              </div>
              <p
                className={`mt-2.5 text-[0.92rem] leading-7 ${
                  unlocked ? "text-[#D7DEE7]" : "text-[#AEB8C5]"
                }`}
              >
                {unlocked
                  ? clue.summary
                  : "线索仍被遮罩。继续与相关 NPC 交谈以恢复完整数据片段。"}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[#AEB8C5]">
                  Source // {clue.sourceNpcId.toUpperCase()}
                </p>
                {relatedToActiveNpc ? (
                  <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#D7DEE7]">
                    linked
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
