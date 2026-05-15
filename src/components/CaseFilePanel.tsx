import { useState } from "react";
import type { CaseMeta, CaseTestimony, Clue, Npc } from "../types/game";
import { useClueUnlockAnimation } from "../hooks/useClueUnlockAnimation";
import { PanelFrame } from "./PanelFrame";

type CaseFileTab = "summary" | "testimony" | "clues";
type TestimonyKind = "contradiction" | "special" | "timeline";

const CASE_FILE_TABS: Array<{ id: CaseFileTab; label: string }> = [
  { id: "summary", label: "案件摘要" },
  { id: "testimony", label: "关键证词" },
  { id: "clues", label: "线索" },
];

const TIMELINE_CLUE_IDS = new Set(["thermal-gap", "maintenance-route"]);
const SPECIAL_SPEECH_CLUE_IDS = new Set(["ghost-proxy", "mirror-contract"]);
const ANOMALY_CLUE_IDS = new Set(["thermal-gap", "maintenance-route"]);

interface CaseFilePanelProps {
  caseFile: CaseMeta;
  clues: Clue[];
  npcs: Npc[];
  discoveredClueIds: string[];
  keyTestimonies: CaseTestimony[];
  progressLabel: string;
  onClueUnlock?: () => void;
}

function getTestimonyKind(testimony: CaseTestimony): TestimonyKind {
  if (testimony.linkedClueIds.some((clueId) => TIMELINE_CLUE_IDS.has(clueId))) {
    return "timeline";
  }

  if (testimony.linkedClueIds.some((clueId) => SPECIAL_SPEECH_CLUE_IDS.has(clueId))) {
    return "special";
  }

  return "contradiction";
}

function getTestimonyMeta(kind: TestimonyKind) {
  if (kind === "timeline") {
    return {
      label: "时间线冲突",
      badgeClass: "border-[#8eb2c166] bg-[rgba(142,178,193,0.12)] text-[#E2EEF7]",
    };
  }

  if (kind === "special") {
    return {
      label: "特殊发言",
      badgeClass: "border-[#9c95b566] bg-[rgba(156,149,181,0.12)] text-[#F0EAFE]",
    };
  }

  return {
    label: "矛盾证词",
    badgeClass: "border-[#ffd15e55] bg-[rgba(255,209,94,0.12)] text-[#FFF0C4]",
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-2.5">
      <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[#AEB8C5]">{label}</p>
      <p className="mt-1.5 text-base font-semibold text-[#E2E8F0]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-5 text-sm leading-7 text-[#AEB8C5]">
      {text}
    </div>
  );
}

export function CaseFilePanel({
  caseFile,
  clues,
  npcs,
  discoveredClueIds,
  keyTestimonies,
  progressLabel,
  onClueUnlock,
}: CaseFilePanelProps) {
  const [activeTab, setActiveTab] = useState<CaseFileTab>("summary");
  const { clueStates } = useClueUnlockAnimation(discoveredClueIds, onClueUnlock);
  const clueById = new Map(clues.map((clue) => [clue.id, clue]));
  const discoveredClues = discoveredClueIds
    .map((clueId) => clueById.get(clueId))
    .filter((clue): clue is Clue => Boolean(clue));
  const testimonyFeed = [...keyTestimonies].reverse();
  const clueTitleById = new Map(clues.map((clue) => [clue.id, clue.title]));
  const npcNameById = new Map(npcs.map((npc) => [npc.id, npc.name]));
  const testimonyCounts = testimonyFeed.reduce(
    (counts, testimony) => {
      counts[getTestimonyKind(testimony)] += 1;
      return counts;
    },
    { contradiction: 0, special: 0, timeline: 0 },
  );
  const evidenceClues = discoveredClues.filter((clue) => !ANOMALY_CLUE_IDS.has(clue.id));
  const anomalyClues = discoveredClues.filter((clue) => ANOMALY_CLUE_IDS.has(clue.id));
  const latestFindings = discoveredClues.slice(-3).reverse();

  return (
    <PanelFrame
      title="Case File"
      subtitle="案件信息按摘要、证词、线索分类整理。"
      className="flex h-full min-h-[24rem] flex-col overflow-hidden p-4 sm:p-5"
      action={
        <div className="terminal-pill rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
          {discoveredClues.length}/{clues.length} records
        </div>
      }
    >
      <div className="mb-3 shrink-0 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CASE_FILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`terminal-tab flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium tracking-[0.08em] ${
              activeTab === tab.id ? "is-active" : ""
            }`}
          >
            {tab.label}
            {tab.id === "testimony" && keyTestimonies.length > 0 && (
              <span className="rounded-full bg-[#ffd15e]/25 px-1.5 py-0.5 text-[0.58rem] text-[#ffd15e]">
                {keyTestimonies.length}
              </span>
            )}
            {tab.id === "clues" && discoveredClues.length > 0 && (
              <span className="rounded-full bg-[#8eb2c1]/25 px-1.5 py-0.5 text-[0.58rem] text-[#8eb2c1]">
                {discoveredClues.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scroll-secondary">
        {activeTab === "summary" ? (
          <div className="space-y-3">
            <section className="cyber-card rounded-[22px] p-3.5">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                案件背景
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.brief.background}</p>
            </section>

            <div className="grid grid-cols-2 gap-2.5">
              <section className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  玩家目标
                </p>
                <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">{caseFile.objective}</p>
              </section>
              <section className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  当前阶段
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#E2E8F0]">
                  {caseFile.phase}
                </p>
                <p className="mt-2 text-[0.78rem] leading-5 text-[#AEB8C5]">{progressLabel}</p>
              </section>
            </div>

            <section className="cyber-card rounded-[22px] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                    当前调查方向
                  </p>
                  <p className="mt-1 text-sm text-[#D6DEEA]">按当前阶段整理的追问重点。</p>
                </div>
                <span className="terminal-pill rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em]">
                  {caseFile.brief.investigationDirections.length} items
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {caseFile.brief.investigationDirections.map((direction, index) => (
                  <div
                    key={direction}
                    className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-sm leading-6 text-[#D6DEEA]"
                  >
                    <span className="mr-2 text-[#E2E8F0]">{index + 1}.</span>
                    {direction}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "testimony" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="矛盾证词" value={testimonyCounts.contradiction} />
              <StatCard label="特殊发言" value={testimonyCounts.special} />
              <StatCard label="时间线冲突" value={testimonyCounts.timeline} />
            </div>

            <div className="space-y-2.5">
              {testimonyFeed.length ? (
                testimonyFeed.map((testimony) => {
                  const kind = getTestimonyKind(testimony);
                  const meta = getTestimonyMeta(kind);

                  return (
                    <article
                      key={testimony.messageId}
                      className="rounded-[20px] border border-white/8 bg-white/[0.05] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em] ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="terminal-pill rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em]">
                            {testimony.npcName}
                          </span>
                        </div>
                        <span className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                          {testimony.timestamp}
                        </span>
                      </div>
                      <p className="mt-2.5 text-[0.92rem] leading-6 text-[#E2E8F0]">
                        {testimony.text}
                      </p>
                      {testimony.linkedClueIds.length ? (
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
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <EmptyState text="关键证词会在 NPC 提供可落档信息后自动出现在这里。" />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "clues" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="已发现线索" value={discoveredClues.length} />
              <StatCard label="证据" value={evidenceClues.length} />
              <StatCard label="监控异常" value={anomalyClues.length} />
            </div>

            <section className="cyber-card rounded-[22px] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                    新发现内容
                  </p>
                  <p className="mt-1 text-sm text-[#D6DEEA]">最近解锁的案件更新。</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {latestFindings.length ? (
                  latestFindings.map((clue) => {
                    const clueState = clueStates[clue.id];
                    const showNewBadge = clueState?.showBadge ?? false;
                    return (
                      <div
                        key={clue.id}
                        className={`rounded-[18px] border border-white/8 bg-[rgba(142,178,193,0.08)] px-3.5 py-2.5 ${
                          clueState?.isNewlyUnlocked ? "clue-unlock-animate" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[#E2E8F0]">{clue.title}</p>
                          {showNewBadge ? (
                            <span className="clue-new-badge rounded-full px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em]">
                              NEW CLUE
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-[#D7DEE7]">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[0.78rem] leading-5 text-[#AEB8C5]">
                          来源 {npcNameById.get(clue.sourceNpcId) ?? clue.sourceNpcId.toUpperCase()}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState text="新的线索与证据会在审讯推进后自动归档到这里。" />
                )}
              </div>
            </section>

            <section className="cyber-card rounded-[22px] p-3.5">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">证据</p>
              <div className="mt-3 space-y-2.5">
                {evidenceClues.length ? (
                  evidenceClues.map((clue) => {
                    const clueState = clueStates[clue.id];
                    const showNewBadge = clueState?.showBadge ?? false;
                    return (
                      <article
                        key={clue.id}
                        className={`rounded-[20px] border border-white/8 bg-white/[0.05] p-3 ${
                          clueState?.isNewlyUnlocked ? "clue-unlock-animate" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.95rem] font-semibold text-slate-50">{clue.title}</p>
                            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                              {clue.category}
                            </p>
                          </div>
                          {showNewBadge ? (
                            <span className="clue-new-badge rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em]">
                              NEW CLUE
                            </span>
                          ) : (
                            <span className="terminal-pill rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em]">
                              {npcNameById.get(clue.sourceNpcId) ?? clue.sourceNpcId.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 text-[0.92rem] leading-6 text-[#D7DEE7]">
                          {clue.summary}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState text="案件证据尚未形成稳定链条，继续追问相关 NPC。" />
                )}
              </div>
            </section>

            <section className="cyber-card rounded-[22px] p-3.5">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                监控异常
              </p>
              <div className="mt-3 space-y-2.5">
                {anomalyClues.length ? (
                  anomalyClues.map((clue) => {
                    const clueState = clueStates[clue.id];
                    const showNewBadge = clueState?.showBadge ?? false;
                    return (
                      <article
                        key={clue.id}
                        className={`rounded-[20px] border border-white/8 bg-[rgba(142,178,193,0.08)] p-3 ${
                          clueState?.isNewlyUnlocked ? "clue-unlock-animate" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.95rem] font-semibold text-slate-50">{clue.title}</p>
                            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                              {clue.category}
                            </p>
                          </div>
                          {showNewBadge ? (
                            <span className="clue-new-badge rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em]">
                              NEW CLUE
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em] text-[#D7DEE7]">
                              异常
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 text-[0.92rem] leading-6 text-[#D7DEE7]">
                          {clue.summary}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState text="监控与路径异常尚未被完整恢复。" />
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </PanelFrame>
  );
}
