import type { CaseMeta } from "../types/game";

interface CaseBriefCardProps {
  caseFile: CaseMeta;
  mode?: "compact" | "full";
}

export function CaseBriefCard({
  caseFile,
  mode = "compact",
}: CaseBriefCardProps) {
  const isFull = mode === "full";

  return (
    <section className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#AEB8C5]">Case Brief</p>
          <p className="mt-1 text-sm text-[#D6DEEA]">
            先确认死者、身份、目标和第一轮调查路径。
          </p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-1 text-[0.64rem] uppercase tracking-[0.2em] text-[#D7DEE7]">
          找出真正凶手
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">案件名称</p>
          <p className="mt-2 text-sm font-medium leading-6 text-[#E2E8F0]">{caseFile.title}</p>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">你的身份</p>
          <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">{caseFile.brief.playerRole}</p>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">死者信息</p>
          <p className="mt-2 text-sm font-medium leading-6 text-[#E2E8F0]">
            {caseFile.brief.victim.name} / {caseFile.brief.victim.identity}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">{caseFile.brief.victim.summary}</p>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">调查目标</p>
          <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">{caseFile.objective}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">案件背景</p>
        <p className="mt-2 text-sm leading-7 text-[#D6DEEA]">{caseFile.brief.background}</p>
      </div>

      <div className="mt-4">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">当前嫌疑人</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {caseFile.brief.currentSuspects.map((suspect) => (
            <span
              key={suspect}
              className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] leading-5 text-[#E2E8F0]"
            >
              {suspect}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">调查方向</p>
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

      {isFull ? (
        <>
          <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">世界背景</p>
            <p className="mt-2 text-sm leading-7 text-[#D6DEEA]">{caseFile.worldBackground}</p>
          </div>

          <div className="mt-4">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#AEB8C5]">
              关键人物关系
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
        </>
      ) : null}
    </section>
  );
}
