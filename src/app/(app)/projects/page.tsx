"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutGrid, List as ListIcon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/section-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { listProjects, getProjectsByStage } from "@/services/projects.service";
import { deleteProjectAction } from "@/actions/projects";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import type { ProjectListQuery, ProjectSummary } from "@/features/projects/types";
import { formatCurrency, localizedValue, localizeProjectStage, localizeProjectStatus } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const STATUS_BADGES: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700",
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  archived: "bg-muted text-muted-foreground",
};

const STAGE_BADGES: Record<string, string> = {
  discovery: "text-violet-700",
  design: "text-blue-700",
  approval: "text-amber-700",
  execution: "text-emerald-700",
  handover: "text-slate-600",
};

export default function ProjectsPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [status, setStatus] = useState<ProjectSummary["status"] | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectSummary | null>(null);

  const query: ProjectListQuery = { page, pageSize, search: search || undefined, status };

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", query],
    queryFn: () => listProjects(query),
    staleTime: 1000 * 60 * 5,
  });

  const kanbanQuery = useQuery({
    queryKey: ["projects-kanban"],
    queryFn: () => getProjectsByStage(),
    enabled: viewMode === "kanban",
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProjectAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueriesData({ queryKey: ["projects"] });
      queryClient.setQueriesData({ queryKey: ["projects"] }, (current: unknown) => {
        if (!current || typeof current !== "object") return current;
        const d = current as { items?: ProjectSummary[]; total?: number };
        if (!Array.isArray(d.items)) return current;
        return { ...d, total: Math.max(0, (d.total ?? 0) - 1), items: d.items.filter((p) => p.id !== id) };
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous?.forEach(([k, v]) => queryClient.setQueryData(k, v));
      toast.error(localizedValue(locale, { en: "Failed to delete project", he: "מחיקת הפרויקט נכשלה" }));
    },
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error || localizedValue(locale, { en: "Failed to delete project", he: "מחיקת הפרויקט נכשלה" })); return; }
      toast.success(localizedValue(locale, { en: "Project deleted", he: "הפרויקט נמחק" }));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState title={localizedValue(locale, { en: "Error loading projects", he: "שגיאה בטעינת פרויקטים" })} description={localizedValue(locale, { en: "Failed to load the projects list.", he: "טעינת רשימת הפרויקטים נכשלה." })} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Projects"
        title={localizedValue(locale, { en: "Project management", he: "ניהול פרויקטים" })}
        description={localizedValue(locale, { en: "Track delivery timelines, budgets, team allocation, and project stages.", he: "עקוב אחר לוחות זמנים, תקציבים, הקצאת צוות ושלבי פרויקט." })}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {localizedValue(locale, { en: "New project", he: "פרויקט חדש" })}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface/30 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            placeholder={localizedValue(locale, { en: "Search projects...", he: "חפש פרויקטים..." })}
            className="pl-10"
            value={search}
            aria-label={localizedValue(locale, { en: "Search projects", he: "חיפוש פרויקטים" })}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={status ?? ""}
          aria-label={localizedValue(locale, { en: "Filter by status", he: "סינון לפי סטטוס" })}
          onChange={(e) => { setStatus((e.target.value as ProjectSummary["status"]) || undefined); setPage(1); }}
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">{localizedValue(locale, { en: "All statuses", he: "כל הסטטוסים" })}</option>
          <option value="active">{localizedValue(locale, { en: "Active", he: "פעיל" })}</option>
          <option value="planning">{localizedValue(locale, { en: "Planning", he: "בתכנון" })}</option>
          <option value="on_hold">{localizedValue(locale, { en: "On hold", he: "בהמתנה" })}</option>
          <option value="completed">{localizedValue(locale, { en: "Completed", he: "הושלם" })}</option>
        </select>
        <div className="flex gap-2" role="group" aria-label={localizedValue(locale, { en: "View mode", he: "מצב תצוגה" })}>
          <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}>
            <ListIcon className="h-4 w-4" /><span className="sr-only">{localizedValue(locale, { en: "Table view", he: "תצוגת טבלה" })}</span>
          </Button>
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" aria-pressed={viewMode === "kanban"} onClick={() => setViewMode("kanban")}>
            <LayoutGrid className="h-4 w-4" /><span className="sr-only">{localizedValue(locale, { en: "Kanban view", he: "תצוגת קנבן" })}</span>
          </Button>
        </div>
      </div>

      {viewMode === "table" && (
        <div className="overflow-hidden rounded-3xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{localizedValue(locale, { en: "Project", he: "פרויקט" })}</TableHead>
                <TableHead>{localizedValue(locale, { en: "Client", he: "לקוח" })}</TableHead>
                <TableHead>{localizedValue(locale, { en: "Stage", he: "שלב" })}</TableHead>
                <TableHead>{localizedValue(locale, { en: "Status", he: "סטטוס" })}</TableHead>
                <TableHead className="text-right">{localizedValue(locale, { en: "Budget", he: "תקציב" })}</TableHead>
                <TableHead className="text-right">{localizedValue(locale, { en: "Progress", he: "התקדמות" })}</TableHead>
                <TableHead className="w-36 text-right">{localizedValue(locale, { en: "Actions", he: "פעולות" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.items.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32">
                        <EmptyState title={localizedValue(locale, { en: "No projects yet", he: "עדיין אין פרויקטים" })} description={localizedValue(locale, { en: "Create your first project to get started.", he: "צור את הפרויקט הראשון שלך כדי להתחיל." })} />
                      </TableCell>
                    </TableRow>
                  )
                  : data?.items.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-surface/30">
                      <TableCell className="font-medium text-foreground" onClick={() => router.push(`/projects/${project.id}`)}>
                        {project.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted">{project.clientName}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium capitalize ${STAGE_BADGES[project.stage] ?? "text-foreground"}`}>
                          {localizeProjectStage(locale, project.stage)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[project.status]}`}>
                          {localizeProjectStatus(locale, project.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatCurrency(locale, project.budget, "USD", { notation: "compact" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto w-16">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label={localizedValue(locale, { en: `${project.progress}% complete`, he: `${project.progress}% הושלם` })} />
                          </div>
                          <span className="mt-0.5 block text-right text-xs text-muted">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${project.id}`)}>{localizedValue(locale, { en: "Open", he: "פתח" })}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditProject(project)}>{localizedValue(locale, { en: "Edit", he: "ערוך" })}</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={deleteMutation.isPending}
                            onClick={() => { if (confirm(localizedValue(locale, { en: `Delete "${project.name}"?`, he: `למחוק את "${project.name}"?` })) ) deleteMutation.mutate(project.id); }}>
                            {localizedValue(locale, { en: "Delete", he: "מחק" })}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "900px" }}>
            {(kanbanQuery.isLoading
              ? Array.from({ length: 5 }).map((_, i) => ({ stage: `loading-${i}`, label: "", projects: [] }))
              : kanbanQuery.data ?? []
            ).map((col) => (
              <div key={col.stage} className="flex min-w-48 flex-1 flex-col gap-3">
                <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {kanbanQuery.isLoading ? <Skeleton className="h-3 w-20" /> : col.label}
                  <span className="ml-1.5 text-muted-foreground/60">{col.projects.length}</span>
                </div>
                {col.projects.map((p) => (
                  <button key={p.id} type="button" className="rounded-2xl border border-border bg-background p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => router.push(`/projects/${p.id}`)}>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="mt-1 text-xs text-muted">{p.clientName}</p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/50">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{p.progress}% · {formatCurrency(locale, p.budget, "USD", { notation: "compact" })}</p>
                  </button>
                ))}
                {col.projects.length === 0 && !kanbanQuery.isLoading && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">{localizedValue(locale, { en: "No projects", he: "אין פרויקטים" })}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data && viewMode === "table" && (
        <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <ProjectFormDialog open={Boolean(editProject)} onOpenChange={(open) => { if (!open) setEditProject(null); }} mode="edit" initialProject={editProject ?? undefined} />
    </main>
  );
}
