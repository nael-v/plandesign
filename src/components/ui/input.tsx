import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
