"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createProjectAction, updateProjectAction } from "@/actions/projects";
import { projectFormSchema, ProjectFormValues } from "@/features/projects/validation";
import type { ProjectSummary } from "@/features/projects/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialProject?: ProjectSummary;
};

const DEFAULT_VALUES: ProjectFormValues = {
  name: "",
  description: "",
  location: "",
  clientId: "",
  stage: "discovery",
  status: "planning",
  budget: 0,
  startDate: "",
  endDate: "",
};

export function ProjectFormDialog({ open, onOpenChange, mode, initialProject }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialProject) {
      form.reset({
        name: initialProject.name,
        description: "",
        location: "",
        clientId: initialProject.clientId,
        stage: initialProject.stage,
        status: initialProject.status,
        budget: initialProject.budget,
        startDate: initialProject.startDate
          ? new Date(initialProject.startDate).toISOString().slice(0, 10)
          : "",
        endDate: initialProject.endDate
          ? new Date(initialProject.endDate).toISOString().slice(0, 10)
          : "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [form, initialProject, mode, open]);

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) => {
      if (mode === "edit" && initialProject) {
        return updateProjectAction(initialProject.id, values);
      }
      return createProjectAction(values);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to save project");
        return;
      }
      toast.success(mode === "create" ? "Project created" : "Project updated");
      onOpenChange(false);
      form.reset(DEFAULT_VALUES);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Failed to save project"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new project for a client with full lifecycle tracking."
              : "Update project details, stage, and budget."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-2">
            <Label htmlFor="p-name">Project name</Label>
            <Input id="p-name" placeholder="e.g. Villa Renovation – Tel Aviv" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600" role="alert">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-client">Client ID</Label>
            <Input id="p-client" placeholder="Client ID" {...form.register("clientId")} />
            {form.formState.errors.clientId && (
              <p className="text-xs text-red-600" role="alert">{form.formState.errors.clientId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="p-stage">Stage</Label>
              <select
                id="p-stage"
                className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                {...form.register("stage")}
              >
                <option value="discovery">Discovery</option>
                <option value="design">Design</option>
                <option value="approval">Approval</option>
                <option value="execution">Execution</option>
                <option value="handover">Handover</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-status">Status</Label>
              <select
                id="p-status"
                className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                {...form.register("status")}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-budget">Budget ($)</Label>
            <Input
              id="p-budget"
              type="number"
              min={0}
              step={1000}
              {...form.register("budget", { valueAsNumber: true })}
            />
            {form.formState.errors.budget && (
              <p className="text-xs text-red-600" role="alert">{form.formState.errors.budget.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="p-start">Start date</Label>
              <Input id="p-start" type="date" {...form.register("startDate")} />
              {form.formState.errors.startDate && (
                <p className="text-xs text-red-600" role="alert">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-end">End date</Label>
              <Input id="p-end" type="date" {...form.register("endDate")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-location">Location</Label>
            <Input id="p-location" placeholder="City, address" {...form.register("location")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-desc">Description</Label>
            <textarea
              id="p-desc"
              className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Brief project overview…"
              {...form.register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { onOpenChange(false); form.reset(DEFAULT_VALUES); }}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : mode === "create"
                  ? "Create project"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
