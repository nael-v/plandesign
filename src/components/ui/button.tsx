import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-slate-950 text-white hover:bg-slate-800 shadow-sm",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-border",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}