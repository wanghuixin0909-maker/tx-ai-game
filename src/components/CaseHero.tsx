import type { CaseDefinition, Npc } from "../types/game";

interface CaseHeroProps {
  caseDefinition: CaseDefinition;
  activeNpc?: Npc;
  categoryLabel: string;
  discoveredCluesCount: number;
  progressLabel: string;
  responseMode: "remote" | "fallback";
  onBrowseCases: () => void;
}

function MetaPills({
  caseDefinition,
  categoryLabel,
  responseMode,
}: Pick<CaseHeroProps, "caseDefinition" | "categoryLabel" | "responseMode">) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="terminal-pill rounded-full px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em]">
        {caseDefinition.caseFile.phase}
      </span>
      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
        {categoryLabel}
      </span>
      <span
        className={`rounded-full border px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] ${
          responseMode === "remote"
            ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.12)] text-[#E7F4FA]"
            : "border-[#ffd15e55] bg-[rgba(255,209,94,0.12)] text-[#FFE7A8]"
        }`}
      >
        {responseMode === "remote" ? "远程 AI 审问" : "本地案件推演"}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  toneClass = "border-white/8 bg-white/[0.04]",
}: {
  label: string;
  value: string;
  detail: string;
  toneClass?: string;
}) {
  return (
    <div className={`rounded-[20px] border px-3.5 py-2.5 ${toneClass}`}>
      <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-[#E2E8F0]">{value}</p>
      <p className="mt-0.5 text-sm leading-6 text-[#D6DEEA]">{detail}</p>
    </div>
  );
}

export function CaseHero({
  caseDefinition,
  activeNpc,
  categoryLabel,
  discoveredCluesCount,
  progressLabel,
  responseMode,
  onBrowseCases,
}: CaseHeroProps) {
  const commonAction = (
    <button
      type="button"
      onClick={onBrowseCases}
      className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-sm font-medium text-[#E2E8F0] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
    >
      返回剧本库
    </button>
  );

  if (caseDefinition.categoryId === "social-mystery") {
    return (
      <section className="cyber-panel overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,199,122,0.18),_transparent_28%),linear-gradient(120deg,_rgba(255,219,166,0.08),_transparent_36%)]" />
        <div className="relative flex flex-col gap-3.5">
          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-[#F6D79A]">
                Inheritance Dossier
              </p>
              <h1 className="mt-1.5 text-[1.42rem] font-bold leading-[1.08] tracking-[0.015em] text-slate-50 sm:text-[1.74rem]">
                {caseDefinition.caseFile.title}
              </h1>
              <p className="mt-2.5 max-w-3xl text-[0.96rem] leading-7 text-[#F3E6CC]">
                {caseDefinition.selectionSummary}
              </p>
              <MetaPills
                caseDefinition={caseDefinition}
                categoryLabel={categoryLabel}
                responseMode={responseMode}
              />
            </div>

            <div className="flex justify-start xl:justify-end">{commonAction}</div>
          </div>

          <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <div className="rounded-[22px] border border-[#f5c77a33] bg-[rgba(245,199,122,0.08)] p-3.5">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#F6D79A]">
                  核心矛盾
                </p>
                <p className="mt-2 text-base font-semibold text-[#FFF4DA]">
                  遗嘱、分红与码头监控相互牵连
                </p>
                <p className="mt-2 text-sm leading-6 text-[#F3E6CC]">
                  先核对书面证据的流转，再看谁有能力控制出入口和受害者行动线。
                </p>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3.5">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                  当前嫌疑圈
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {caseDefinition.caseFile.brief.currentSuspects.map((suspect) => (
                    <span
                      key={suspect}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-[#E2E8F0]"
                    >
                      {suspect}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
              <StatCard
                label="当前对象"
                value={activeNpc?.name ?? "--"}
                detail={activeNpc?.role ?? caseDefinition.caseFile.district}
                toneClass="border-[#f5c77a22] bg-[rgba(255,230,185,0.06)]"
              />
              <StatCard
                label="已获线索"
                value={`${discoveredCluesCount}/${caseDefinition.clues.length}`}
                detail={progressLabel}
              />
              <StatCard
                label="受害者"
                value={caseDefinition.caseFile.brief.victim.name}
                detail={caseDefinition.caseFile.brief.victim.identity}
              />
              <StatCard
                label="调查切口"
                value={caseDefinition.caseFile.brief.investigationDirections[0] ?? "梳理关系链"}
                detail="先抓利益链，再反推作案时序。"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (caseDefinition.categoryId === "locked-room") {
    return (
      <section className="cyber-panel overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,162,255,0.18),_transparent_30%),linear-gradient(135deg,_rgba(244,216,255,0.08),_transparent_42%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-[#F0B8FF]">
                Stage Lockdown
              </p>
              <h1 className="mt-1.5 text-[1.48rem] font-bold leading-[1.08] tracking-[0.015em] text-slate-50 sm:text-[1.82rem]">
                {caseDefinition.caseFile.title}
              </h1>
              <p className="mt-2.5 text-[0.96rem] leading-7 text-[#F3DFFA]">
                {caseDefinition.selectionSummary}
              </p>
              <MetaPills
                caseDefinition={caseDefinition}
                categoryLabel={categoryLabel}
                responseMode={responseMode}
              />
            </div>
            {commonAction}
          </div>

          <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[24px] border border-[#e8a2ff33] bg-[rgba(232,162,255,0.08)] p-3.5">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#F0B8FF]">密室条件</p>
              <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
                <StatCard
                  label="舞台位置"
                  value={caseDefinition.caseFile.district}
                  detail="核心空间被锁定，时序判断比大范围排查更重要。"
                  toneClass="border-white/8 bg-black/10"
                />
                <StatCard
                  label="当前对象"
                  value={activeNpc?.name ?? "--"}
                  detail={activeNpc?.role ?? "待确认"}
                  toneClass="border-white/8 bg-black/10"
                />
                <StatCard
                  label="线索进度"
                  value={`${discoveredCluesCount}/${caseDefinition.clues.length}`}
                  detail={progressLabel}
                  toneClass="border-white/8 bg-black/10"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-3.5">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#AEB8C5]">排查顺序</p>
              <div className="mt-2.5 space-y-2">
                {caseDefinition.caseFile.brief.investigationDirections.map((direction, index) => (
                  <div
                    key={direction}
                    className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-[#E2E8F0]"
                  >
                    <span className="mr-2 text-[#F0B8FF]">{index + 1}.</span>
                    {direction}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (caseDefinition.categoryId === "closed-space") {
    return (
      <section className="cyber-panel overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(143,240,200,0.18),_transparent_28%),linear-gradient(135deg,_rgba(143,240,200,0.08),_transparent_40%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-[#A8F5D8]">
                Rail Crisis Trace
              </p>
              <h1 className="mt-1.5 text-[1.48rem] font-bold leading-[1.08] tracking-[0.015em] text-slate-50 sm:text-[1.82rem]">
                {caseDefinition.caseFile.title}
              </h1>
              <p className="mt-2.5 text-[0.96rem] leading-7 text-[#D8F5EA]">
                {caseDefinition.selectionSummary}
              </p>
              <MetaPills
                caseDefinition={caseDefinition}
                categoryLabel={categoryLabel}
                responseMode={responseMode}
              />
            </div>
            {commonAction}
          </div>

          <div className="grid gap-2.5 lg:grid-cols-4">
            <StatCard
              label="事发区段"
              value={caseDefinition.caseFile.district}
              detail={caseDefinition.caseFile.threatLevel}
              toneClass="border-[#8ff0c833] bg-[rgba(143,240,200,0.08)]"
            />
            <StatCard
              label="线索回收"
              value={`${discoveredCluesCount}/${caseDefinition.clues.length}`}
              detail={progressLabel}
            />
            <StatCard
              label="当前对象"
              value={activeNpc?.name ?? "--"}
              detail={activeNpc?.role ?? "待确认"}
            />
            <StatCard
              label="受害者"
              value={caseDefinition.caseFile.brief.victim.name}
              detail={caseDefinition.caseFile.brief.victim.identity}
            />
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#A8F5D8]">封闭空间节奏</p>
            <div className="mt-2.5 grid gap-2 md:grid-cols-3">
              {caseDefinition.caseFile.brief.investigationDirections.map((direction) => (
                <div
                  key={direction}
                  className="rounded-[18px] border border-white/8 bg-black/10 px-3 py-2.5 text-sm leading-6 text-[#E2E8F0]"
                >
                  {direction}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cyber-panel overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,211,255,0.18),_transparent_26%),linear-gradient(135deg,_rgba(139,211,255,0.08),_transparent_42%)]" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-[#B8DFFF]">
            Neural Casefeed
          </p>
          <h1 className="mt-1.5 text-[1.48rem] font-bold leading-[1.08] tracking-[0.015em] text-slate-50 sm:text-[1.86rem]">
            {caseDefinition.caseFile.title}
          </h1>
          <p className="mt-2.5 text-[0.96rem] leading-7 text-[#D7EAF8]">
            {caseDefinition.selectionSummary}
          </p>
          <MetaPills
            caseDefinition={caseDefinition}
            categoryLabel={categoryLabel}
            responseMode={responseMode}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {caseDefinition.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.72rem] text-[#E2E8F0]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-[720px] flex-col gap-2.5">
          <div className="flex justify-end">{commonAction}</div>
          <div className="grid gap-2.5 md:grid-cols-4">
            <StatCard
              label="当前对象"
              value={activeNpc?.name ?? "--"}
              detail={activeNpc?.role ?? caseDefinition.caseFile.district}
              toneClass="border-[#8bd3ff33] bg-[rgba(139,211,255,0.08)]"
            />
            <StatCard
              label="已获线索"
              value={`${discoveredCluesCount}/${caseDefinition.clues.length}`}
              detail={progressLabel}
            />
            <StatCard
              label="受害者"
              value={caseDefinition.caseFile.brief.victim.name}
              detail={caseDefinition.caseFile.brief.victim.identity}
            />
            <StatCard
              label="风险等级"
              value={caseDefinition.caseFile.threatLevel}
              detail="优先用 AI 审问串起时间差与权限差。"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
