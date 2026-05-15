import { useEffect, useId, useRef, useState } from "react";
import type { CaseMeta } from "../types/game";

interface CaseBriefCardProps {
  caseFile: CaseMeta;
  mode?: "compact" | "full";
  density?: "default" | "tight";
}

function buildBriefSummary(caseFile: CaseMeta) {
  const roleLead = caseFile.brief.playerRole.split(/[，。]/)[0]?.trim();

  if (roleLead) {
    return `${roleLead}，调查${caseFile.brief.victim.name}死亡事件。`;
  }

  return caseFile.briefing;
}

export function CaseBriefCard({
  caseFile,
  mode = "compact",
  density = "default",
}: CaseBriefCardProps) {
  const isFull = mode === "full";
  const isTight = density === "tight";
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const detailsInnerRef = useRef<HTMLDivElement | null>(null);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const summary = buildBriefSummary(caseFile);

  useEffect(() => {
    const element = detailsInnerRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => setDetailsHeight(element.scrollHeight);

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [caseFile, isFull]);

  return (
    <section
      className={`rounded-[24px] border border-white/8 bg-white/[0.04] ${
        isTight ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#AEB8C5]">Case Brief</p>
          <p className="mt-1 text-[0.92rem] leading-6 text-[#E2E8F0]">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
            Mission Active
          </span>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={() => setIsExpanded((current) => !current)}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.68rem] font-medium text-[#E2E8F0] transition-colors duration-200 hover:bg-white/[0.08]"
          >
            {isExpanded ? "收起" : "展开"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.brief.victim.name}
        </span>
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.brief.victim.identity}
        </span>
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.phase}
        </span>
      </div>

      <div
        id={detailsId}
        aria-hidden={!isExpanded}
        className="overflow-hidden"
        style={{
          maxHeight: isExpanded ? detailsHeight : 0,
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? "auto" : "none",
          transition: "max-height 220ms ease, opacity 180ms ease",
        }}
      >
        <div ref={detailsInnerRef} className={isTight ? "pt-3" : "pt-4"}>
          <div className={`grid gap-3 ${isTight ? "" : "sm:grid-cols-2"}`}>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">案件背景</p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.brief.background}</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">玩家目标</p>
              <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">{caseFile.objective}</p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.brief.playerRole}</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">NPC 说明</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {caseFile.brief.currentSuspects.map((suspect) => (
                  <span
                    key={suspect}
                    className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] leading-5 text-[#E2E8F0]"
                  >
                    {suspect}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">调查方向</p>
              <div className="mt-2 space-y-2">
                {caseFile.brief.investigationDirections.map((direction, index) => (
                  <div
                    key={direction}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-6 text-[#D6DEEA]"
                  >
                    <span className="mr-2 text-[#E2E8F0]">{index + 1}.</span>
                    {direction}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">世界观</p>
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.worldBackground}</p>
          </div>

          <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">受害者信息</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#E2E8F0]">
              {caseFile.brief.victim.name} / {caseFile.brief.victim.identity}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.brief.victim.summary}</p>
          </div>

          {isFull ? (
            <div className="mt-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                关系图谱
              </p>
              <div className="mt-2 space-y-2">
                {caseFile.relationshipMap.map((relationship, index) => (
                  <div
                    key={relationship}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-6 text-[#D6DEEA]"
                  >
                    <span className="mr-2 text-[#E2E8F0]">{index + 1}.</span>
                    {relationship}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
