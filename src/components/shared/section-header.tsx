import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">{eyebrow}</p> : null}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}