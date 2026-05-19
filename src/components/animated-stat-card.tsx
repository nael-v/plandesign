"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "red";
  description?: string;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
};

export function AnimatedStatCard({
  label,
  value,
  trend,
  icon: Icon,
  color = "blue",
  description,
  loading,
}: AnimatedStatCardProps) {
  const colors = colorClasses[color];
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend?.direction === "up" ? "text-emerald-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-border bg-white p-6 overflow-hidden group"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-blue-500 to-emerald-500" />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
            <h3 className="mt-1 text-3xl font-bold text-foreground">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
              ) : (
                value
              )}
            </h3>
          </div>

          {Icon && (
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", colors.bg)}>
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted">{description}</p>
        )}

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1.5 pt-2">
            <TrendIcon className={cn("h-4 w-4", trendColor)} />
            <span className={cn("text-xs font-medium", trendColor)}>
              {trend.direction === "up" ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-white p-6 space-y-4"
    >
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-2 w-full animate-pulse rounded bg-slate-200" />
    </motion.div>
  );
}
