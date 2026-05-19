"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckSquare2, Plus, Circle, ArrowRight, Eye, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addProjectTaskAction, moveProjectTaskAction } from "@/actions/projects";
import { taskFormSchema, TaskFormValues } from "@/features/projects/validation";
import type { ProjectTask } from "@/features/projects/types";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

const COLUMNS: { id: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "todo", label: "To Do", icon: <Circle className="h-3.5 w-3.5" />, color: "text-slate-500" },
  { id: "in_progress", label: "In Progress", icon: <ArrowRight className="h-3.5 w-3.5" />, color: "text-blue-500" },
  { id: "review", label: "Review", icon: <Eye className="h-3.5 w-3.5" />, color: "text-amber-500" },
  { id: "done", label: "Done", icon: <CheckCheck className="h-3.5 w-3.5" />, color: "text-emerald-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-50 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

type Props = {
  projectId: string;
  tasks: ProjectTask[];
};

export function ProjectTaskBoard({ projectId, tasks }: Props) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" },
  });

  const addTaskMutation = useMutation({
    mutationFn: (values: TaskFormValues) =>
      addProjectTaskAction({ projectId, ...values }),
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error || "Failed to add task"); return; }
      toast.success("Task added");
      setAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] });
    },
    onError: () => toast.error("Failed to add task"),
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      moveProjectTaskAction({ taskId, status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["project-workspace", projectId] });
      const previous = queryClient.getQueryData(["project-workspace", projectId]);
      queryClient.setQueryData(["project-workspace", projectId], (current: { project?: { tasks?: ProjectTask[] } } | null) => {
        if (!current?.project?.tasks) return current;
        return {
          ...current,
          project: {
            ...current.project,
            tasks: current.project.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t,
            ),
          },
        };
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["project-workspace", projectId], ctx.previous);
      toast.error("Failed to move task");
    },
    onSuccess: (result) => {
      if (!result.success) toast.error(result.error || "Failed to move task");
    },
  });

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const handleDrop = (status: TaskStatus) => {
    if (dragging && dragging !== status) {
      const task = tasks.find((t) => t.id === dragging);
      if (task && task.status !== status) {
        moveTaskMutation.mutate({ taskId: dragging, status });
      }
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckSquare2 className="h-4 w-4 text-blue-600" />
          Tasks
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = byStatus(col.id);
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              className={`rounded-2xl border p-3 transition-colors ${isOver ? "border-blue-400 bg-blue-50/50" : "border-border bg-surface/30"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className={`mb-3 flex items-center gap-2 text-xs font-medium ${col.color}`}>
                {col.icon}
                {col.label}
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`group cursor-grab rounded-xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${dragging === task.id ? "opacity-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-muted">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add task dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => addTaskMutation.mutate(values))}
          >
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input placeholder="Task title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Optional description"
                {...form.register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <select
                  className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                  {...form.register("priority")}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Due date</Label>
                <Input type="date" {...form.register("dueDate")} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setAddDialogOpen(false); form.reset(); }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button type="submit" disabled={addTaskMutation.isPending}>
                {addTaskMutation.isPending ? "Adding..." : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
