"use client";


import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  icon?: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "red";
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  title?: string;
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export function ActivityTimeline({ items, title }: ActivityTimelineProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <section className="space-y-4" aria-label={title || "Activity timeline"}>
      {title && (
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <ol className="space-y-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          const color = colorClasses[item.color || "blue"];

          return (
            <motion.li
              key={item.id}
              variants={itemVariants}
              className="group flex gap-4 rounded-2xl p-2 transition-colors hover:bg-surface/70"
            >
              {/* Timeline indicator */}
              <div className="relative flex flex-col items-center">
                {/* Dot */}
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-surface shadow-sm", color)}>
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Line */}
                {index < items.length - 1 && (
                  <div className="mt-2 h-14 w-0.5 bg-gradient-to-b from-border to-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted/70" aria-label="timestamp">
                    {item.timestamp}
                  </p>
                </div>
              </div>
            </motion.li>
          );
        })}
        </ol>
      </motion.div>
    </section>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-2 w-48 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
