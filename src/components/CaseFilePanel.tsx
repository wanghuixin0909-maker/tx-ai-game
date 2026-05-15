import type { CaseMeta, CaseTestimony, Clue, Npc } from "../types/game";
import { CaseBriefCard } from "./CaseBriefCard";
import { PanelFrame } from "./PanelFrame";

interface CaseFilePanelProps {
  caseFile: CaseMeta;
  clues: Clue[];
  npcs: Npc[];
  discoveredClueIds: Set<string>;
  keyTestimonies: CaseTestimony[];
  progressLabel: string;
}

export function CaseFilePanel({
  caseFile,
  clues,
  npcs,
  discoveredClueIds,
  keyTestimonies,
  progressLabel,
}: CaseFilePanelProps) {
  const discoveredClues = clues.filter((clue) => discoveredClueIds.has(clue.id));
  const testimonyFeed = [...keyTestimonies].reverse();
  const clueTitleById = new Map(clues.map((clue) => [clue.id, clue.title]));
  const npcNameById = new Map(npcs.map((npc) => [npc.id, npc.name]));

  return (
    <PanelFrame
      title="Case File"
      subtitle="案件摘要、关键证词与线索会持续保存在这里。"
      className="h-full min-h-[24rem] p-4 sm:p-5"
      action={
        <div className="terminal-pill rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
          {discoveredClues.length}/{clues.length} records
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <section className="cyber-card rounded-[24px] p-3.5">
          <CaseBriefCard caseFile={caseFile} mode="full" density="tight" />
        </section>

        <section className="cyber-card rounded-[24px] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Case Phase
              </p>
              <p className="mt-2 text-lg font-semibold text-[#E2E8F0]">{caseFile.phase}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.05] px-3 py-2 text-right">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Progress
              </p>
              <p className="mt-1 text-sm text-[#D7DEE7]">{progressLabel}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Found Clues
              </p>
              <p className="mt-2 text-base font-semibold text-[#E2E8F0]">
                {discoveredClues.length}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Key Testimony
              </p>
              <p className="mt-2 text-base font-semibold text-[#E2E8F0]">
                {keyTestimonies.length}
              </p>
            </div>
          </div>
        </section>

        <section className="cyber-card rounded-[24px] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                Key Testimony
              </p>
              <p className="mt-1 text-sm text-[#D6DEEA]">
                Statements that pushed the case forward.
              </p>
            </div>
          </div>
          <div className="mt-3 max-h-[15rem] space-y-2.5 overflow-y-auto pr-1">
            {testimonyFeed.length ? (
              testimonyFeed.map((testimony) => (
                <article
                  key={testimony.messageId}
                  className="rounded-[20px] border border-white/8 bg-white/[0.05] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="terminal-pill rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.14em]">
                      {testimony.npcName}
                    </span>
                    <span className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                      {testimony.timestamp}
                    </span>
                  </div>
                  <p className="mt-2.5 text-[0.92rem] leading-6 text-[#E2E8F0]">
                    {testimony.text}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {testimony.linkedClueIds.map((clueId) => (
                      <span
                        key={clueId}
                        className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em] text-[#D7DEE7]"
                      >
                        {clueTitleById.get(clueId) ?? clueId}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-5 text-sm leading-7 text-[#AEB8C5]">
                No testimony has been promoted into the case file yet.
              </div>
            )}
          </div>
        </section>

        <section className="cyber-card min-h-0 flex-1 rounded-[24px] p-3.5">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  Discovered Clues
                </p>
                <p className="mt-1 text-sm text-[#D6DEEA]">
                  Persisted evidence linked to the current case.
                </p>
              </div>
            </div>
            <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {discoveredClues.length ? (
                discoveredClues.map((clue) => (
                  <article
                    key={clue.id}
                    className="rounded-[20px] border border-white/8 bg-[rgba(142,178,193,0.08)] p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.95rem] font-semibold text-slate-50">
                          {clue.title}
                        </p>
                        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                          {clue.category}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
                        {npcNameById.get(clue.sourceNpcId) ?? clue.sourceNpcId.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[0.92rem] leading-6 text-[#D7DEE7]">
                      {clue.summary}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-5 text-sm leading-7 text-[#AEB8C5]">
                  Newly recovered clues will be pinned here automatically.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PanelFrame>
  );
}
