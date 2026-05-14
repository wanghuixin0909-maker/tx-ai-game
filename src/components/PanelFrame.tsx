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
    <section className={`cyber-panel ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="panel-heading text-[0.68rem] font-medium uppercase">
            {title}
          </p>
          {subtitle ? (
            <p className="panel-subtitle mt-2.5 max-w-[34rem] text-[0.95rem]">
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
