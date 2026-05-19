"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, LayoutGrid, List as ListIcon, MessageSquarePlus, UserPlus, PackagePlus, CheckSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getProjectActivities,
  getProjectLifecycleSnapshot,
  getProjectTaskBoard,
  listProjects,
} from "@/services/projects.service";
import { ProjectListQuery } from "@/features/projects/types";
import {
  addProjectCommentAction,
  addProjectTaskAction,
  assignProjectMemberAction,
  attachProjectSupplierAction,
  moveProjectTaskAction,
  uploadProjectFileAction,
} from "@/actions/workflows";
import { SlideOver } from "@/components/slide-over";
import { KanbanBoard } from "@/components/kanban-board";
import { FileDropzone } from "@/components/workflow/file-dropzone";
import { ActivityTimeline } from "@/components/activity-timeline";
import { MeetingsCalendar } from "@/components/workflow/meetings-calendar";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [status, setStatus] = useState<"active" | "planning" | "on_hold" | "completed" | "archived" | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [memberId, setMemberId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const query: ProjectListQuery = {
    page,
    pageSize,
    search: search || undefined,
    status,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", query],
    queryFn: () => listProjects(query),
    staleTime: 1000 * 60 * 5,
  });

  const lifecycleQuery = useQuery({
    queryKey: ["project-lifecycle", selectedProjectId],
    queryFn: () => (selectedProjectId ? getProjectLifecycleSnapshot(selectedProjectId) : null),
    enabled: Boolean(selectedProjectId),
  });

  const boardQuery = useQuery({
    queryKey: ["project-board", selectedProjectId],
    queryFn: () => (selectedProjectId ? getProjectTaskBoard(selectedProjectId) : null),
    enabled: Boolean(selectedProjectId),
  });

  const activityQuery = useQuery({
    queryKey: ["project-activity", selectedProjectId],
    queryFn: () => (selectedProjectId ? getProjectActivities(selectedProjectId) : []),
    enabled: Boolean(selectedProjectId),
  });

  const addTaskMutation = useMutation({
    mutationFn: () =>
      addProjectTaskAction({
        projectId: selectedProjectId,
        title: newTaskTitle || "New workflow task",
        priority: "medium",
      }),
    onSuccess: () => {
      setNewTaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["project-board", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: "todo" | "in_progress" | "review" | "done" }) =>
      moveProjectTaskAction({ taskId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-board", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) =>
      uploadProjectFileAction({
        projectId: selectedProjectId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-lifecycle", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: () => addProjectCommentAction({ projectId: selectedProjectId, content: newComment }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["project-lifecycle", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const assignMemberMutation = useMutation({
    mutationFn: () => assignProjectMemberAction({ projectId: selectedProjectId, userId: memberId, role: "member" }),
    onSuccess: () => {
      setMemberId("");
      queryClient.invalidateQueries({ queryKey: ["project-lifecycle", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const attachSupplierMutation = useMutation({
    mutationFn: () => attachProjectSupplierAction({ projectId: selectedProjectId, supplierId }),
    onSuccess: () => {
      setSupplierId("");
      queryClient.invalidateQueries({ queryKey: ["project-activity", selectedProjectId] });
    },
  });

  const statusBadges: Record<string, string> = {
    planning: "bg-slate-50 text-slate-700",
    active: "bg-emerald-50 text-emerald-700",
    on_hold: "bg-amber-50 text-amber-700",
    completed: "bg-blue-50 text-blue-700",
    archived: "bg-muted text-muted-foreground",
  };

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState title="Error loading projects" description="Failed to load the projects list" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Projects"
        title="Project management"
        description="Track delivery timelines, budgets, team allocation, and project stages."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New project wizard
          </Button>
        }
      />

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface/30 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={status || ""}
          onChange={(e) => {
            const nextValue = e.target.value;
            setStatus(
              nextValue
                ? (nextValue as "active" | "planning" | "on_hold" | "completed" | "archived")
                : undefined,
            );
            setPage(1);
          }}
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-3xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <EmptyState title="No projects yet" description="Create your first project to get started." />
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                    <TableCell className="text-sm text-muted">{project.clientName}</TableCell>
                    <TableCell className="text-sm text-foreground capitalize">{project.stage}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusBadges[project.status]}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">${(project.budget / 1000).toFixed(0)}k</TableCell>
                    <TableCell className="text-right">
                      <div className="w-16 rounded-full bg-muted h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProjectId(project.id)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {data && viewMode === "table" && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <SlideOver
        open={Boolean(selectedProjectId)}
        onClose={() => setSelectedProjectId(null)}
        title={lifecycleQuery.data?.project.name || "Project lifecycle"}
        description="Team, tasks, suppliers, files, comments, and activity"
        width="xl"
      >
        <div className="space-y-6 p-6">
          {!lifecycleQuery.data ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-foreground">Add task</h4>
                  <Input
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    placeholder="Task title"
                    className="mt-2"
                  />
                  <Button className="mt-3" onClick={() => addTaskMutation.mutate()}>
                    <CheckSquare2 className="h-4 w-4" />
                    Add task
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-foreground">Assign team member</h4>
                  <Input
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    placeholder="User ID"
                    className="mt-2"
                  />
                  <Button className="mt-3" onClick={() => assignMemberMutation.mutate()}>
                    <UserPlus className="h-4 w-4" />
                    Assign member
                  </Button>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-foreground">Attach supplier</h4>
                  <Input
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    placeholder="Supplier ID"
                    className="mt-2"
                  />
                  <Button className="mt-3" onClick={() => attachSupplierMutation.mutate()}>
                    <PackagePlus className="h-4 w-4" />
                    Attach supplier
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-foreground">Add project comment</h4>
                  <Input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Comment"
                    className="mt-2"
                  />
                  <Button className="mt-3" onClick={() => addCommentMutation.mutate()}>
                    <MessageSquarePlus className="h-4 w-4" />
                    Post comment
                  </Button>
                </div>
              </section>

              {boardQuery.data && (
                <KanbanBoard
                  columns={[
                    {
                      id: "todo",
                      title: "Todo",
                      cards: boardQuery.data.todo.map((task) => ({
                        id: task.id,
                        title: task.title,
                        description: task.description || undefined,
                        label: task.priority,
                        color: "blue",
                      })),
                    },
                    {
                      id: "in_progress",
                      title: "In Progress",
                      cards: boardQuery.data.in_progress.map((task) => ({
                        id: task.id,
                        title: task.title,
                        description: task.description || undefined,
                        label: task.priority,
                        color: "amber",
                      })),
                    },
                    {
                      id: "review",
                      title: "Review",
                      cards: boardQuery.data.review.map((task) => ({
                        id: task.id,
                        title: task.title,
                        description: task.description || undefined,
                        label: task.priority,
                        color: "red",
                      })),
                    },
                    {
                      id: "done",
                      title: "Done",
                      cards: boardQuery.data.done.map((task) => ({
                        id: task.id,
                        title: task.title,
                        description: task.description || undefined,
                        label: task.priority,
                        color: "emerald",
                      })),
                    },
                  ]}
                  onCardMove={(taskId, _fromColumnId, toColumnId) => {
                    if (toColumnId === "todo" || toColumnId === "in_progress" || toColumnId === "review" || toColumnId === "done") {
                      moveTaskMutation.mutate({ taskId, status: toColumnId });
                    }
                  }}
                />
              )}

              <FileDropzone
                title="Upload plans and project documents"
                accept="image/*,.pdf"
                onUpload={async (file) => {
                  await uploadFileMutation.mutateAsync(file);
                }}
              />

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Project documents</h4>
                  <ul className="space-y-2 text-sm">
                    {lifecycleQuery.data.attachments.map((attachment) => (
                      <li key={attachment.id} className="rounded-xl border border-border bg-surface p-2">
                        <p className="font-medium text-foreground">{attachment.name}</p>
                        <p className="text-xs text-muted">
                          {attachment.mimeType} • {Math.round(attachment.size / 1024)} KB
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Project comments</h4>
                  <ul className="space-y-2 text-sm">
                    {lifecycleQuery.data.comments.map((comment) => (
                      <li key={comment.id} className="rounded-xl border border-border bg-surface p-2">
                        <p className="font-medium text-foreground">{comment.author}</p>
                        <p className="text-xs text-muted">{comment.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <MeetingsCalendar projectId={selectedProjectId || undefined} clientId={lifecycleQuery.data.project.clientId} />

              <ActivityTimeline
                title="Project activity history"
                items={(activityQuery.data || []).map((item) => ({
                  id: item.id,
                  label: item.description,
                  description: item.actor,
                  timestamp: new Date(item.timestamp).toLocaleString(),
                  color: "blue",
                }))}
              />
            </>
          )}
        </div>
      </SlideOver>
    </main>
  );
}