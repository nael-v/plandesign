"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createInvoiceAction, updateInvoiceAction } from "@/actions/financials";
import { invoiceFormSchema, InvoiceFormValues } from "@/features/financials/validation";
import type { FinanceFormOption, FinancialInvoice } from "@/features/financials/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialInvoice?: FinancialInvoice;
  clients: FinanceFormOption[];
  projects: FinanceFormOption[];
};

const DEFAULT_VALUES: InvoiceFormValues = {
  clientId: "",
  projectId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  subtotal: 0,
  taxRate: 17,
  notes: "",
};

export function InvoiceFormDialog({ open, onOpenChange, mode, initialInvoice, clients, projects }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialInvoice) {
      form.reset({
        clientId: initialInvoice.clientId || "",
        projectId: initialInvoice.projectId || "",
        issueDate: initialInvoice.issueDate ? new Date(initialInvoice.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        dueDate: initialInvoice.dueDate ? new Date(initialInvoice.dueDate).toISOString().slice(0, 10) : "",
        subtotal: initialInvoice.subtotal,
        taxRate: initialInvoice.taxRate,
        notes: initialInvoice.notes || "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, initialInvoice, form]);

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) => {
      if (mode === "edit" && initialInvoice) {
        return updateInvoiceAction(initialInvoice.id, values);
      }
      return createInvoiceAction(values);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to save invoice");
        return;
      }
      toast.success(mode === "create" ? "Invoice created" : "Invoice updated");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: () => toast.error("Failed to save invoice"),
  });

  const subtotal = useWatch({ control: form.control, name: "subtotal" }) || 0;
  const taxRate = useWatch({ control: form.control, name: "taxRate" }) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create invoice" : "Edit invoice"}</DialogTitle>
          <DialogDescription>Manage billing details, tax, and due-date workflow.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Client</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("clientId")}>
                <option value="">Unlinked</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.label}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Project</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("projectId")}>
                <option value="">Unlinked</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Issue date</Label>
              <Input type="date" {...form.register("issueDate")} />
            </div>
            <div className="grid gap-2">
              <Label>Due date</Label>
              <Input type="date" {...form.register("dueDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Subtotal</Label>
              <Input type="number" step={0.01} {...form.register("subtotal", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label>Tax rate (%)</Label>
              <Input type="number" step={0.01} {...form.register("taxRate", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/40 p-3 text-sm">
            <p className="text-muted">Tax: ${tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="font-semibold text-foreground">Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
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
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
