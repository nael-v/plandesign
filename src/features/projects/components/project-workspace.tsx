"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ProjectOverview } from "@/features/projects/components/project-overview";
import { ProjectTaskBoard } from "@/features/projects/components/project-task-board";
import { ProjectBlueprints } from "@/features/projects/components/project-blueprints";
import { ProjectTimeline } from "@/features/projects/components/project-timeline";
import { ProjectComments } from "@/features/projects/components/project-comments";
import {
  getProjectLifecycleSnapshot,
  getProjectActivities,
} from "@/services/projects.service";

type Props = { projectId: string };

export function ProjectWorkspace({ projectId }: Props) {
  const snapshotQuery = useQuery({
    queryKey: ["project-workspace", projectId],
    queryFn: async () => {
      const [snapshot, activities] = await Promise.all([
        getProjectLifecycleSnapshot(projectId),
        getProjectActivities(projectId),
      ]);
      return { ...snapshot, activities };
    },
    staleTime: 1000 * 30,
  });

  const timelineItems = useMemo(() => {
    const activities = snapshotQuery.data?.activities ?? [];
    return activities.map((a) => ({
      id: a.id,
      label: a.description,
      description: `${a.actor} · ${a.type.replace("_", " ")}`,
      timestamp: new Date(a.timestamp).toLocaleString(),
      color: "blue" as const,
    }));
  }, [snapshotQuery.data?.activities]);

  if (snapshotQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading project workspace">
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (snapshotQuery.isError || !snapshotQuery.data?.project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been removed or you may not have access."
      />
    );
  }

  const { project, comments, attachments } = snapshotQuery.data;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <ProjectOverview project={project} />
      </section>

      {/* Timeline / phase tracker */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <ProjectTimeline project={project} />
      </section>

      {/* Team + Suppliers */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">Team members</h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {project.members.length}
            </span>
          </div>
          {project.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">Suppliers</h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {project.suppliers.length}
            </span>
          </div>
          {project.suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.suppliers.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.category} &middot; {s.contact}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Task Kanban board */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <ProjectTaskBoard projectId={projectId} tasks={project.tasks} />
      </section>

      {/* Blueprints */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <ProjectBlueprints projectId={projectId} attachments={attachments ?? []} />
      </section>

      {/* Comments */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <ProjectComments projectId={projectId} comments={comments ?? []} />
      </section>

      {/* Activity feed */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-foreground">Activity feed</h3>
        </div>
        {timelineItems.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Actions like task updates, file uploads, and comments appear here."
          />
        ) : (
          <ActivityTimeline title="" items={timelineItems} />
        )}
      </section>
    </div>
  );
}
