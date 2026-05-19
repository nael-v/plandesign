import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface/30 px-4 py-16 text-center sm:gap-4 sm:px-6",
        className,
      )}
    >
      {icon && <div className="text-3xl text-muted">{icon}</div>}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
