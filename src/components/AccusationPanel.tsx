import { useState } from "react";
import type { Npc } from "../types/game";
import { ConfirmModal } from "./ConfirmModal";

interface AccusationPanelProps {
  npcs: Npc[];
  discoveredCluesCount: number;
  onSubmit: (suspectId: string) => void;
  isSubmitted: boolean;
  isCorrect: boolean | null;
}

export function AccusationPanel({
  npcs,
  discoveredCluesCount,
  onSubmit,
  isSubmitted,
  isCorrect,
}: AccusationPanelProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const canAccuse = discoveredCluesCount >= 3;

  const handleSubmit = () => {
    if (selectedSuspect) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirm = () => {
    if (selectedSuspect) {
      onSubmit(selectedSuspect);
      setShowConfirmModal(false);
    }
  };

  const selectedNpc = npcs.find((npc) => npc.id === selectedSuspect);

  return (
    <div className="space-y-4">
      {/* 警告提示 */}
      {!canAccuse && (
        <div className="rounded-2xl border border-[#ffd15e55] bg-[rgba(255,209,94,0.08)] p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-[#ffd15e]">证据不足</p>
              <p className="mt-1 text-xs text-[#AEB8C5]">
                需要至少 3 条线索才能提交指控。当前: {discoveredCluesCount}/3
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 已完成状态 */}
      {isSubmitted && isCorrect === true && (
        <div className="rounded-2xl border border-[#5ef2ff55] bg-[rgba(94,242,255,0.08)] p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-medium text-[#5ef2ff]">案件告破</p>
              <p className="mt-1 text-xs text-[#AEB8C5]">
                你的推理正确！凶手已被绳之以法。
              </p>
            </div>
          </div>
        </div>
      )}

      {isSubmitted && isCorrect === false && (
        <div className="rounded-2xl border border-[#ff6b6b55] bg-[rgba(255,107,107,0.08)] p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">❌</span>
            <div>
              <p className="text-sm font-medium text-[#ff6b6b]">推理有误</p>
              <p className="mt-1 text-xs text-[#AEB8C5]">
                这不是真正的凶手。请继续收集证据。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 嫌疑人列表 */}
      {!isSubmitted && (
        <>
          <p className="text-sm text-[#D6DEEA]">
            {canAccuse
              ? "选择你认为是凶手的人："
              : "收集更多线索后，再做出最终判断。"}
          </p>

          <div className="space-y-2">
            {npcs.map((npc) => (
              <button
                key={npc.id}
                type="button"
                disabled={!canAccuse}
                onClick={() => setSelectedSuspect(npc.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  !canAccuse
                    ? "cursor-not-allowed opacity-50"
                    : selectedSuspect === npc.id
                      ? "border-[#ffd15e] bg-[rgba(255,209,94,0.1)]"
                      : "border-white/8 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 单选框 */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedSuspect === npc.id
                        ? "border-[#ffd15e] bg-[#ffd15e]"
                        : "border-white/30"
                    }`}
                  >
                    {selectedSuspect === npc.id && (
                      <div className="h-2 w-2 rounded-full bg-[#1a1a2e]" />
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ color: npc.accentColor }}
                    >
                      {npc.name}
                    </p>
                    <p className="text-xs text-[#AEB8C5]">{npc.role}</p>
                  </div>

                  {/* 信任等级 */}
                  <div className="shrink-0">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase"
                      style={{
                        borderColor: `${npc.accentColor}50`,
                        color: npc.accentColor,
                      }}
                    >
                      T{npc.trustLevel}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 提交按钮 */}
          <button
            type="button"
            disabled={!selectedSuspect || !canAccuse}
            onClick={handleSubmit}
            className={`w-full rounded-2xl py-3.5 text-sm font-semibold tracking-wide transition-all ${
              selectedSuspect && canAccuse
                ? "cursor-pointer bg-gradient-to-r from-[#ffd15e] to-[#ff9f43] text-[#1a1a2e] hover:opacity-90"
                : "cursor-not-allowed bg-white/8 text-[#AEB8C5]"
            }`}
          >
            {selectedSuspect
              ? `指控 ${selectedNpc?.name}`
              : "选择一名嫌疑人"}
          </button>
        </>
      )}

      {/* 确认模态框 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="确认指控"
        message={`你确定要指控 ${selectedNpc?.name} 为凶手吗？此操作无法撤销。`}
        confirmText="确认指控"
        cancelText="取消"
        danger={true}
      />
    </div>
  );
}
