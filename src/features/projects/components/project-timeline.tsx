"use client";

import { Flag, Milestone } from "lucide-react";
import type { ProjectSummary } from "@/features/projects/types";

const STAGES = ["discovery", "design", "approval", "execution", "handover"] as const;

const STAGE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  design: "Design",
  approval: "Approval",
  execution: "Execution",
  handover: "Handover",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  discovery: "Initial brief, site analysis, and scope definition",
  design: "Concept development, schematic design, and client review",
  approval: "Permit applications, authority submissions, and approvals",
  execution: "Construction documentation, site supervision, and delivery",
  handover: "Final snagging, sign-off, and project archival",
};

type Props = {
  project: ProjectSummary;
};

export function ProjectTimeline({ project }: Props) {
  const currentIndex = STAGES.indexOf(project.stage as typeof STAGES[number]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Milestone className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">Project phases</h3>
      </div>

      {/* Horizontal progress track */}
      <div className="relative">
        {/* Track line */}
        <div className="absolute left-3 right-3 top-3.5 h-0.5 bg-muted/50" />
        <div
          className="absolute left-3 top-3.5 h-0.5 bg-blue-500 transition-all duration-700"
          style={{
            width:
              currentIndex < 0
                ? "0%"
                : `${(currentIndex / (STAGES.length - 1)) * 94}%`,
          }}
        />

        {/* Stage dots */}
        <div className="relative flex justify-between">
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={stage} className="flex flex-col items-center gap-1.5" style={{ width: "20%" }}>
                <div
                  className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                    isPast
                      ? "border-blue-500 bg-blue-500 text-white"
                      : isCurrent
                        ? "border-blue-500 bg-background text-blue-600 shadow-sm shadow-blue-200"
                        : "border-muted bg-background text-muted"
                  }`}
                  aria-label={isCurrent ? `Current stage: ${STAGE_LABELS[stage]}` : STAGE_LABELS[stage]}
                >
                  {isPast ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isCurrent ? (
                    <Flag className="h-3 w-3" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>

                <div className="hidden text-center sm:block">
                  <p
                    className={`text-xs font-medium leading-tight ${
                      isCurrent ? "text-blue-600" : isPast ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage detail */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
          Current phase · {STAGE_LABELS[project.stage]}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {STAGE_DESCRIPTIONS[project.stage] ?? "Active phase"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Phase progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage list for mobile */}
      <div className="space-y-1.5 sm:hidden">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={stage}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                isCurrent ? "bg-blue-50 text-blue-700 font-medium" : isPast ? "text-foreground" : "text-muted"
              }`}
            >
              <span className="text-xs text-muted w-4">{idx + 1}.</span>
              {STAGE_LABELS[stage]}
              {isCurrent && <span className="ml-auto text-xs text-blue-500">← current</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
