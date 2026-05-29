import type { PropsWithChildren, ReactNode } from "react";

interface PanelFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PanelFrame({
  title,
  subtitle,
  action,
  className = "",
  children,
}: PanelFrameProps) {
  return (
    <section className={`cyber-panel flex h-full min-h-0 flex-col ${className}`}>
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="panel-heading text-[0.68rem] font-medium uppercase">
            {title}
          </p>
          {subtitle ? (
            <p className="panel-subtitle mt-1.5 max-w-[34rem] text-[0.92rem]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
