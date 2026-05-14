interface PlayerInputProps {
  draftMessage: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function PlayerInput({
  draftMessage,
  onDraftChange,
  onSend,
  disabled = false,
  isLoading = false,
}: PlayerInputProps) {
  return (
    <div className="cyber-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.24em] text-[#AEB8C5]">
        <span className="terminal-pill rounded-full px-2.5 py-1">
          Prompt Lane
        </span>
        <span className="rounded-full border border-white/8 bg-[rgba(142,178,193,0.08)] px-2.5 py-1 text-[#D7DEE7]">
          Live inference channel
        </span>
      </div>
      <div className="flex flex-col gap-3.5 md:flex-row">
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
          placeholder="输入你的盘问内容，例如：'谁能接触离线签名密钥？'"
          className="min-h-[104px] flex-1 resize-none rounded-[24px] border border-white/8 bg-white/[0.05] px-4 py-3.5 text-[0.96rem] leading-7 text-slate-50 outline-none transition placeholder:text-slate-400 focus:border-white/10 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
        />
        <div className="flex w-full shrink-0 flex-col justify-between gap-3 md:w-56">
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !draftMessage.trim()}
            aria-busy={isLoading}
            className="rounded-[22px] border border-white/8 bg-[rgba(142,178,193,0.1)] px-4 py-3.5 text-sm font-medium text-slate-50 shadow-[0_10px_20px_rgba(7,12,20,0.14)] transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-[rgba(142,178,193,0.14)] disabled:cursor-not-allowed disabled:border-slate-300/10 disabled:bg-slate-100/[0.05] disabled:text-slate-400"
          >
            {isLoading ? "混元响应中..." : "发送审讯"}
          </button>
          <div className="cyber-card rounded-[22px] px-4 py-3 text-xs leading-6 text-[#D7DEE7]">
            Shift + Enter 换行，Enter 发送。请求超时或失败时会在对话区显示系统提示。
          </div>
        </div>
      </div>
    </div>
  );
}
