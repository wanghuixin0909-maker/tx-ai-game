import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { NpcAvatar } from "../assets/npc/NpcAvatar";
import {
  buildSuspectInsight,
  FINAL_REQUIRED_CLUE_IDS,
  getClueTitle,
} from "../lib/accusation";
import type { AccusationCheckResult, Npc } from "../types/game";

interface AccusationModalProps {
  isOpen: boolean;
  npcs: Npc[];
  discoveredClueIds: string[];
  lastResult: AccusationCheckResult | null;
  onClose: () => void;
  onConfirm: (suspectId: string) => void;
}

const finalSuspectIds = new Set(["nova", "shade", "echo", "iris"]);

export function AccusationModal({
  isOpen,
  npcs,
  discoveredClueIds,
  lastResult,
  onClose,
  onConfirm,
}: AccusationModalProps) {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const suspects = useMemo(
    () => npcs.filter((npc) => finalSuspectIds.has(npc.id)),
    [npcs],
  );
  const evidenceReady = lastResult?.verdict !== "insufficient-evidence";
  const missingClueIds = lastResult?.missingClueIds ?? [];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    modalRef.current?.focus();

    if (!selectedSuspectId && suspects.length > 0) {
      setSelectedSuspectId(suspects[0].id);
    }
  }, [isOpen, selectedSuspectId, suspects]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSuspectId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,10,18,0.82)] px-3 py-6 backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`cyber-panel accusation-modal-shell relative w-full max-w-5xl overflow-hidden p-4 sm:p-6 ${
          evidenceReady ? "" : "accusation-modal-failed"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd15e] to-transparent opacity-80" />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[#ffd15e]">
                FINAL ACCUSATION
              </p>
              <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[0.03em] text-slate-50 sm:text-[2.1rem]">
                最终指控
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D6DEEA]">
                选择你要正式指控的对象。系统将在提交前校验最终证据链，
                证据不足时该指控不会成立。
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#D7DEE7] transition hover:bg-white/[0.08]"
            >关闭</button>
          </div>

          <section className="cyber-card rounded-[24px] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
                  证据链
                </p>
                <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">
                  必要证据:
                  {" "}
                  {FINAL_REQUIRED_CLUE_IDS.map((clueId) => getClueTitle(clueId)).join(" / ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FINAL_REQUIRED_CLUE_IDS.map((clueId) => {
                  const unlocked = discoveredClueIds.includes(clueId);

                  return (
                    <span
                      key={clueId}
                      className={`rounded-full border px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.12em] ${
                        unlocked
                          ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.14)] text-[#E6F3FA]"
                          : "border-[#ff6b6b55] bg-[rgba(255,107,107,0.1)] text-[#FFC6C6]"
                      }`}
                    >
                      {unlocked ? "已锁定" : "缺失"}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {suspects.map((npc) => {
              const insight = buildSuspectInsight(npc.id, discoveredClueIds);
              const isSelected = npc.id === selectedSuspectId;

              return (
                <button
                  key={npc.id}
                  type="button"
                  onClick={() => setSelectedSuspectId(npc.id)}
                  className={`relative overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 ${
                    isSelected
                      ? "border-[color:var(--suspect-accent)] bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_24px_rgba(255,255,255,0.08)]"
                      : "border-white/8 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.06]"
                  }`}
                  style={
                    {
                      "--suspect-accent": npc.accentColor,
                    } as CSSProperties
                  }
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${npc.accentColor}, transparent)`,
                    }}
                  />
                  <div className="flex items-start gap-3">
                    <NpcAvatar npc={npc} size="lg" showRing={isSelected} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-base font-semibold tracking-[0.02em]"
                          style={{ color: npc.accentColor }}
                        >
                          {npc.name}
                        </p>
                        <span
                          className="rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            borderColor: `${npc.accentColor}55`,
                            color: npc.accentColor,
                            background: `${npc.accentColor}14`,
                          }}
                        >
                          {insight.suspicionLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#AEB8C5]">{npc.role}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-[18px] border border-white/8 bg-black/10 px-3 py-2">
                          <p className="uppercase tracking-[0.14em] text-[#8D9AA9]">
                            嫌疑等级
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#E2E8F0]">
                            {insight.suspicionLabel}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-black/10 px-3 py-2">
                          <p className="uppercase tracking-[0.14em] text-[#8D9AA9]">
                            关键线索
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#E2E8F0]">
                            {insight.matchedEvidenceCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="cyber-card rounded-[24px] p-4">
            {lastResult?.verdict === "insufficient-evidence" ? (
              <div className="rounded-[20px] border border-[#ff6b6b55] bg-[rgba(255,107,107,0.1)] px-4 py-3">
                <p className="text-sm font-semibold tracking-[0.06em] text-[#FFB4B4]">
                  证据链不完整，该指控无法成立。
                </p>
                <p className="mt-2 text-xs leading-6 text-[#F2C8C8]">
                  缺失证据:
                  {" "}
                  {missingClueIds.map((clueId) => getClueTitle(clueId)).join(" / ")}
                </p>
              </div>
            ) : (
              <div className="rounded-[20px] border border-white/8 bg-black/10 px-4 py-3">
                <p className="text-sm font-semibold tracking-[0.06em] text-[#E2E8F0]">
                  证据链校验待命中
                </p>
                <p className="mt-2 text-xs leading-6 text-[#AEB8C5]">
                  提交后系统将验证关键线索是否足以支撑最终结论。
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-50 transition hover:bg-white/[0.08]"
              >
                返回调查
              </button>
              <button
                type="button"
                disabled={!selectedSuspectId}
                onClick={() => selectedSuspectId && onConfirm(selectedSuspectId)}
                className={`rounded-[20px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition ${
                  selectedSuspectId
                    ? "bg-gradient-to-r from-[#ffd15e] via-[#ffb347] to-[#ff8d62] text-[#121722] shadow-[0_14px_34px_rgba(255,157,74,0.26)] hover:-translate-y-0.5"
                    : "cursor-not-allowed bg-white/8 text-[#AEB8C5]"
                }`}
              >
                确认指控
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
