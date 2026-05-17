import { NpcAvatar } from "../assets/npc/NpcAvatar";
import type { CaseMeta, Clue, EndingState, Npc } from "../types/game";

interface EndingOverlayProps {
  endingState: EndingState | null;
  caseFile: CaseMeta;
  culpritSummary: {
    summary: string;
    motive: string;
    coverUp: string;
  };
  clues: Clue[];
  npcs: Npc[];
  onClose: () => void;
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
      <p className="text-[0.64rem] uppercase tracking-[0.18em] text-[#AEB8C5]">{label}</p>
      <p className="mt-2 text-[1.4rem] font-semibold tracking-[0.04em] text-slate-50">
        {value}
      </p>
    </div>
  );
}

export function EndingOverlay({
  endingState,
  caseFile,
  culpritSummary,
  clues,
  npcs,
  onClose,
}: EndingOverlayProps) {
  if (!endingState) {
    return null;
  }

  const accusedNpc = npcs.find((npc) => npc.id === endingState.suspectId);
  const isResolved = endingState.verdict === "case-resolved";
  const requiredEvidence = clues.filter((clue) =>
    ["badge-scan", "ghost-proxy", "thermal-gap"].includes(clue.id),
  );

  void caseFile;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(3,6,12,0.9)] px-3 py-6 backdrop-blur-md">
      <div
        className={`cyber-panel ending-overlay-shell relative w-full max-w-5xl overflow-hidden p-5 sm:p-7 ${
          isResolved ? "ending-overlay-success" : "ending-overlay-failure"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p
                className={`text-[0.7rem] uppercase tracking-[0.24em] ${
                  isResolved ? "text-[#5ef2ff]" : "text-[#ff7b7b]"
                }`}
              >
                {isResolved ? "Case Closed" : "System Error"}
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-[0.04em] text-slate-50 sm:text-[2.4rem]">
                {isResolved ? "NEON ECHO // CASE RESOLVED" : "Innocent Target Flagged"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#D6DEEA]">
                {isResolved
                  ? "案件归档完成，真相链已恢复。系统正在同步最终判定与失真记忆片段。"
                  : "最终指控目标与真实案件记录不匹配。系统已标记为错误结案。"}
              </p>
            </div>

            {accusedNpc ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4">
                <div className="flex items-center gap-3">
                  <NpcAvatar npc={accusedNpc} size="lg" showRing={isResolved} />
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                      Accused Target
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-50">
                      {accusedNpc.name}
                    </p>
                    <p className="mt-1 text-xs text-[#AEB8C5]">{accusedNpc.role}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {isResolved ? (
            <>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <section className="cyber-card rounded-[26px] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                    Truth Restored
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#E2E8F0]">
                    {culpritSummary.summary}
                  </p>
                  <p className="mt-4 text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                    Motive
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#D6DEEA]">
                    {culpritSummary.motive}
                  </p>
                  <p className="mt-4 text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                    Framing Sequence
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#D6DEEA]">
                    {culpritSummary.coverUp}
                  </p>
                </section>

                <section className="cyber-card rounded-[26px] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                    Case Score
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <ScoreCard label="Clue Completeness" value={endingState.score.clueCompleteness} />
                    <ScoreCard
                      label="Interrogation Efficiency"
                      value={endingState.score.interrogationEfficiency}
                    />
                    <ScoreCard label="Deduction Accuracy" value={endingState.score.deductionAccuracy} />
                    <ScoreCard label="Overall" value={endingState.score.overall} />
                  </div>
                  <div className="mt-4 rounded-[22px] border border-[#8eb2c166] bg-[rgba(142,178,193,0.08)] px-4 py-3">
                    <p className="text-[0.64rem] uppercase tracking-[0.18em] text-[#C9E0EA]">
                      Archive Sync
                    </p>
                    <div className="mt-2 space-y-2">
                      {endingState.aiLines.map((line) => (
                        <p key={line} className="text-sm text-[#E7F4FA]">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <section className="cyber-card rounded-[26px] p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                  Final Evidence Chain
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiredEvidence.map((clue) => (
                    <span
                      key={clue.id}
                      className="rounded-full border border-[#8eb2c166] bg-[rgba(142,178,193,0.12)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-[#E6F3FA]"
                    >
                      {clue.title}
                    </span>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-[26px] border border-[#ff6b6b44] bg-[rgba(255,107,107,0.08)] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#FF9C9C]">
                Failure Record
              </p>
              <p className="mt-3 text-sm leading-7 text-[#FFD3D3]">
                错误指控已触发红色警报。系统检测到无辜对象被错误锁定，案件将以失败状态归档。
              </p>
              <div className="mt-4 space-y-2">
                {endingState.aiLines.map((line) => (
                  <p key={line} className="text-sm text-[#FFD3D3]">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-50 transition hover:bg-white/[0.1]"
            >
              {isResolved ? "Return to Archive" : "Resume Investigation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
