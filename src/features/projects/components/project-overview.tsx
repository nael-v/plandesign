"use client";

import { Building2, Calendar, DollarSign, MapPin, TrendingUp, Users } from "lucide-react";
import type { ProjectDetail } from "@/features/projects/types";
import { formatCurrency, formatDate, localizedValue, localizeProjectStage, localizeProjectStatus } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-violet-50 text-violet-700 ring-violet-200",
  design: "bg-blue-50 text-blue-700 ring-blue-200",
  approval: "bg-amber-50 text-amber-700 ring-amber-200",
  execution: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  handover: "bg-slate-50 text-slate-700 ring-slate-200",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  archived: "bg-muted text-muted-foreground",
};

type Props = { project: ProjectDetail };

export function ProjectOverview({ project }: Props) {
  const { locale } = useLocale();
  const budgetUsed = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 100) : 0;
  const isOverBudget = project.spent > project.budget;

  return (
    <div className="space-y-4">
      {/* Header meta */}
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STAGE_COLORS[project.stage] ?? "bg-muted text-muted-foreground ring-border"}`}
        >
          {localizeProjectStage(locale, project.stage)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {localizeProjectStatus(locale, project.status)}
        </span>
        {project.location && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3" />
            {project.location}
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-sm leading-relaxed text-muted">{project.description}</p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label={localizedValue(locale, { en: "Progress", he: "התקדמות" })}
          value={`${project.progress}%`}
          sub={<ProgressBar value={project.progress} color="emerald" />}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-blue-600" />}
          label={localizedValue(locale, { en: "Budget", he: "תקציב" })}
          value={formatCurrency(locale, project.budget, "USD", { notation: "compact" })}
          sub={
            <span className={`text-xs ${isOverBudget ? "text-red-600" : "text-muted"}`}>
              {localizedValue(locale, {
                en: `${formatCurrency(locale, project.spent, "USD", { notation: "compact" })} spent`,
                he: `${formatCurrency(locale, project.spent, "USD", { notation: "compact" })} הוצאו`,
              })}
            </span>
          }
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-violet-600" />}
          label={localizedValue(locale, { en: "Team", he: "צוות" })}
          value={String(project.members.length)}
          sub={<span className="text-xs text-muted">{localizedValue(locale, { en: "members", he: "חברים" })}</span>}
        />
        <StatCard
          icon={<Building2 className="h-4 w-4 text-amber-600" />}
          label={localizedValue(locale, { en: "Tasks", he: "משימות" })}
          value={String(project.tasks.length)}
          sub={<span className="text-xs text-muted">{localizedValue(locale, { en: "total", he: "סה" + '"' + "כ" })}</span>}
        />
      </div>

      {/* Budget progress */}
      <div className="rounded-2xl border border-border bg-surface/50 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">{localizedValue(locale, { en: "Budget used", he: "תקציב שנוצל" })}</span>
          <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
            {budgetUsed.toFixed(0)}%
          </span>
        </div>
        <ProgressBar value={budgetUsed} color={isOverBudget ? "red" : "blue"} />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{localizedValue(locale, { en: `${formatCurrency(locale, project.spent)} spent`, he: `${formatCurrency(locale, project.spent)} הוצאו` })}</span>
          <span>{localizedValue(locale, { en: `${formatCurrency(locale, project.budget)} budget`, he: `${formatCurrency(locale, project.budget)} תקציב` })}</span>
        </div>
      </div>

      {/* Dates */}
      {(project.startDate || project.endDate) && (
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          {project.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {localizedValue(locale, { en: "Started", he: "התחיל" })} {formatDate(locale, project.startDate)}
            </span>
          )}
          {project.endDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {localizedValue(locale, { en: "Due", he: "יעד" })} {formatDate(locale, project.endDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <div className="mt-0.5">{sub}</div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: "emerald" | "blue" | "red" }) {
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
