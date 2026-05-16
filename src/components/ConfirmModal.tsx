import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        <div className="rounded-[28px] border border-white/12 bg-[#0f1729] p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            {danger && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            )}
            <h2
              id="modal-title"
              className="text-xl font-bold tracking-wide text-slate-50"
            >
              {title}
            </h2>
          </div>

          <p className="mb-6 text-[0.95rem] leading-6 text-[#D6DEEA]">{message}</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-[22px] border border-white/8 bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-50 transition hover:bg-white/[0.1] hover:-translate-y-0.5"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 rounded-[22px] px-4 py-3 text-sm font-medium shadow-[0_10px_20px_rgba(7,12,20,0.14)] transition hover:-translate-y-0.5 ${
                danger
                  ? "border border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  : "border border-white/10 bg-[rgba(142,178,193,0.1)] text-slate-50 hover:bg-[rgba(142,178,193,0.15)]"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
