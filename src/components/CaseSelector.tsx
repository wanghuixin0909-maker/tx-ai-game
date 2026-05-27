import type { CaseCategory, CaseDefinition } from "../types/game";

interface CaseSelectorProps {
  categories: CaseCategory[];
  activeCategoryId: string;
  selectedCaseId: string;
  cases: CaseDefinition[];
  onCategoryChange: (categoryId: string) => void;
  onSelectCase: (caseId: string) => void;
}

function getAvailabilityLabel(caseDefinition: CaseDefinition) {
  return caseDefinition.remoteSupport ? "AI 审问" : "本地推演";
}

export function CaseSelector({
  categories,
  activeCategoryId,
  selectedCaseId,
  cases,
  onCategoryChange,
  onSelectCase,
}: CaseSelectorProps) {
  const visibleCases = cases.filter((caseDefinition) =>
    activeCategoryId === "all" ? true : caseDefinition.categoryId === activeCategoryId,
  );

  return (
    <section className="cyber-panel p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#AEB8C5]">Case Library</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[0.03em] text-slate-50 sm:text-[1.65rem]">
              可选推理剧本
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
              现在不只是一条主线。玩家可以按类型挑剧本，每个剧本会单独保存进度。
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-[#D6DEEA]">
            共 {cases.length} 个剧本，覆盖 {categories.length - 1} 种类型
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = category.id === activeCategoryId;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`rounded-full border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] transition ${
                  active
                    ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.14)] text-[#E6F3FA]"
                    : "border-white/10 bg-white/[0.03] text-[#AEB8C5] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
                title={category.description}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {visibleCases.map((caseDefinition) => {
            const selected = caseDefinition.id === selectedCaseId;

            return (
              <button
                key={caseDefinition.id}
                type="button"
                onClick={() => onSelectCase(caseDefinition.id)}
                className={`group rounded-[24px] border p-4 text-left transition ${
                  selected
                    ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.1)] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_40px_rgba(7,18,31,0.35)]"
                    : "border-white/8 bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#8EB2C1]">
                      {categories.find((category) => category.id === caseDefinition.categoryId)?.label}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-50">
                      {caseDefinition.caseFile.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] ${
                      caseDefinition.remoteSupport
                        ? "border-[#89d1ff55] bg-[rgba(137,209,255,0.1)] text-[#D8F3FF]"
                        : "border-[#ffd15e44] bg-[rgba(255,209,94,0.1)] text-[#FFE4A6]"
                    }`}
                  >
                    {getAvailabilityLabel(caseDefinition)}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#D6DEEA]">{caseDefinition.selectionSummary}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-[18px] border border-white/8 bg-black/10 px-3 py-2.5">
                    <p className="uppercase tracking-[0.14em] text-[#8D9AA9]">难度</p>
                    <p className="mt-1 text-sm font-semibold text-[#E2E8F0]">{caseDefinition.difficulty}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/10 px-3 py-2.5">
                    <p className="uppercase tracking-[0.14em] text-[#8D9AA9]">时长</p>
                    <p className="mt-1 text-sm font-semibold text-[#E2E8F0]">
                      约 {caseDefinition.estimatedMinutes} 分钟
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {caseDefinition.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.62rem] text-[#D7DEE7]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[#AEB8C5]">
                  <span>{caseDefinition.npcs.length} 名关键对象</span>
                  <span>{caseDefinition.clues.length} 条核心线索</span>
                </div>

                {selected ? (
                  <div className="mt-4 rounded-[18px] border border-[#8eb2c166] bg-[rgba(142,178,193,0.1)] px-3 py-2 text-xs font-medium text-[#E6F3FA]">
                    当前已选中，切换后会自动加载该剧本的独立存档。
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
