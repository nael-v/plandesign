import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium leading-none text-foreground",
        className,
      )}
      {...props}
    />
  );
}
