"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupplierPaymentAction } from "@/actions/financials";
import { supplierPaymentFormSchema, SupplierPaymentFormValues } from "@/features/financials/validation";
import type { FinanceFormOption } from "@/features/financials/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: FinanceFormOption[];
  projects: FinanceFormOption[];
};

const DEFAULT_VALUES: SupplierPaymentFormValues = {
  supplierId: "",
  projectId: "",
  amount: 0,
  status: "pending",
  occurredAt: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function SupplierPaymentDialog({ open, onOpenChange, suppliers, projects }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(supplierPaymentFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: SupplierPaymentFormValues) => createSupplierPaymentAction(values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to create supplier payment");
        return;
      }
      toast.success("Supplier payment created");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: () => toast.error("Failed to create supplier payment"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record supplier payment</DialogTitle>
          <DialogDescription>Track supplier settlement status and procurement cash movement.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-2">
            <Label>Supplier</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("supplierId")}>
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Project</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("projectId")}>
                <option value="">Unlinked</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("status")}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input type="number" step={0.01} {...form.register("amount", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" {...form.register("occurredAt")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <textarea
              className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
