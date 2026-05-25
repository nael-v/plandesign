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
import { createExpenseAction } from "@/actions/financials";
import { ExpenseFormValues, expenseFormSchema } from "@/features/financials/validation";
import type { FinanceFormOption } from "@/features/financials/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: FinanceFormOption[];
  suppliers: FinanceFormOption[];
};

const DEFAULT_VALUES: ExpenseFormValues = {
  label: "",
  category: "materials",
  amount: 0,
  occurredAt: new Date().toISOString().slice(0, 10),
  projectId: "",
  supplierId: "",
  recurring: false,
  receiptUrl: "",
  notes: "",
};

export function ExpenseFormDialog({ open, onOpenChange, projects, suppliers }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => createExpenseAction(values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to create expense");
        return;
      }
      toast.success("Expense created");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: () => toast.error("Failed to create expense"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log expense</DialogTitle>
          <DialogDescription>Track categorized costs with project and supplier context.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Label</Label>
              <Input placeholder="Concrete delivery" {...form.register("label")} />
            </div>
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input type="number" step={0.01} {...form.register("amount", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("category")}>
                <option value="materials">Materials</option>
                <option value="labor">Labor</option>
                <option value="logistics">Logistics</option>
                <option value="furniture">Furniture</option>
                <option value="permits">Permits</option>
                <option value="equipment">Equipment</option>
                <option value="supplier_payment">Supplier payment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Occurred at</Label>
              <Input type="date" {...form.register("occurredAt")} />
            </div>
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
              <Label>Supplier</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("supplierId")}>
                <option value="">Unlinked</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Receipt URL</Label>
              <Input placeholder="https://..." {...form.register("receiptUrl")} />
            </div>
            <div className="grid gap-2">
              <Label>Recurring</Label>
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("recurring")} />
                Mark as recurring-ready
              </label>
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
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save expense"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
