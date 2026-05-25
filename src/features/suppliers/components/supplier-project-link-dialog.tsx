"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { linkSupplierToProjectAction } from "@/actions/suppliers";
import { supplierProjectLinkSchema, SupplierProjectLinkValues } from "@/features/suppliers/validation";
import type { ProjectPhase } from "@/features/suppliers/types";

type ProjectOption = { id: string; name: string; stage: ProjectPhase };

type Props = {
  supplierId: string;
  supplierName: string;
  projects: ProjectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupplierProjectLinkDialog({
  supplierId,
  supplierName,
  projects,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient();
  const form = useForm<SupplierProjectLinkValues>({
    resolver: zodResolver(supplierProjectLinkSchema),
    defaultValues: {
      supplierId,
      projectId: "",
      phase: "execution",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ supplierId, projectId: "", phase: "execution", notes: "" });
  }, [form, open, supplierId]);

  const linkMutation = useMutation({
    mutationFn: (values: SupplierProjectLinkValues) => linkSupplierToProjectAction(values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to link supplier");
        return;
      }
      toast.success("Supplier linked to project");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["supplier-workspace", supplierId] });
    },
    onError: () => toast.error("Failed to link supplier"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign supplier to project</DialogTitle>
          <DialogDescription>
            Link {supplierName} to an active project and phase for procurement tracking.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => linkMutation.mutate(values))}>
          <input type="hidden" {...form.register("supplierId")} />

          <div className="grid gap-2">
            <Label>Project</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("projectId")}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {form.formState.errors.projectId && (
              <p className="text-xs text-red-600">{form.formState.errors.projectId.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Assigned phase</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("phase")}>
              <option value="discovery">Discovery</option>
              <option value="design">Design</option>
              <option value="approval">Approval</option>
              <option value="execution">Execution</option>
              <option value="handover">Handover</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <textarea
              className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Scope, lead times, contractual caveats"
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={linkMutation.isPending}>
              {linkMutation.isPending ? "Linking..." : "Link project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
