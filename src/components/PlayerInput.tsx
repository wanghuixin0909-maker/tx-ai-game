import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface PlayerInputProps {
  draftMessage: string;
  currentObjective: string;
  suggestedPrompts: string[];
  responseMode: "remote" | "fallback";
  onDraftChange: (value: string) => void;
  onUseSuggestedPrompt: (value: string) => void;
  onSend: () => void;
  onReset: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function PlayerInput({
  draftMessage,
  currentObjective,
  suggestedPrompts,
  responseMode,
  onDraftChange,
  onUseSuggestedPrompt,
  onSend,
  onReset,
  disabled = false,
  isLoading = false,
}: PlayerInputProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    onReset();
  };

  return (
    <div className="cyber-panel shrink-0 overflow-visible px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="mb-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
              当前目标
            </p>
            <p className="mt-1 text-sm leading-6 text-[#E2E8F0]">{currentObjective}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.16em] ${
              responseMode === "remote"
                ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.12)] text-[#E7F4FA]"
                : "border-[#ffd15e55] bg-[rgba(255,209,94,0.12)] text-[#FFE7A8]"
            }`}
          >
            {responseMode === "remote" ? "远程响应中" : "离线推演中"}
          </span>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.24em] text-[#AEB8C5]">
        <span className="terminal-pill rounded-full px-2.5 py-1">审问输入</span>
        <span className="rounded-full border border-white/8 bg-[rgba(142,178,193,0.08)] px-2.5 py-1 text-[#D7DEE7]">
          聚焦命案关键矛盾
        </span>
      </div>
      <div className="mb-3">
        <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[#AEB8C5]">推荐追问</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onUseSuggestedPrompt(prompt)}
              className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-left text-[0.78rem] leading-5 text-[#D7DEE7] transition hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.06]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <textarea
          value={draftMessage}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          rows={3}
          placeholder="直接追问作案时间线、死者关系、权限来源，或让对方解释证词矛盾。"
          className="min-h-[96px] flex-1 resize-none rounded-[24px] border border-white/8 bg-white/[0.05] px-4 py-3 text-[0.96rem] leading-7 text-slate-50 outline-none transition placeholder:text-slate-400 focus:border-white/10 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
        />
        <div className="flex w-full shrink-0 flex-col justify-between gap-2.5 md:w-56">
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !draftMessage.trim()}
            aria-busy={isLoading}
            className="rounded-[22px] border border-white/8 bg-[rgba(142,178,193,0.1)] px-4 py-3 text-sm font-medium text-slate-50 shadow-[0_10px_20px_rgba(7,12,20,0.14)] transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-[rgba(142,178,193,0.14)] disabled:cursor-not-allowed disabled:border-slate-300/10 disabled:bg-slate-100/[0.05] disabled:text-slate-400"
          >
            {isLoading ? "审问中..." : "提交审问"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#D7DEE7] transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.06]"
          >
            重置案件
          </button>
          <div className="cyber-card rounded-[22px] px-4 py-2.5 text-xs leading-5 text-[#D7DEE7]">
            先问时间线、动机、权限和死者接触，再用证据追打矛盾点。
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="重置案件？"
        message="此操作将清除所有已收集的线索、证词和对话记录，且无法撤销。确定要重新开始吗？"
        confirmText="确认重置"
        cancelText="返回调查"
        danger={true}
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
