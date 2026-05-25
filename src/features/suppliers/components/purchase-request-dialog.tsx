"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
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
import { createPurchaseRequestAction } from "@/actions/suppliers";
import { PurchaseRequestValues, purchaseRequestSchema } from "@/features/suppliers/validation";
import type { ProjectPhase } from "@/features/suppliers/types";

type ProjectOption = { id: string; name: string; stage: ProjectPhase };

type Props = {
  supplierId: string;
  supplierName: string;
  projects: ProjectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PurchaseRequestDialog({ supplierId, supplierName, projects, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<PurchaseRequestValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      supplierId,
      projectId: "",
      title: "",
      phase: "execution",
      requestedBy: "Procurement",
      notes: "",
      quotes: [
        { supplierLabel: supplierName, amount: 0, currency: "USD", etaDays: 14, notes: "" },
      ],
    },
  });

  const quotesArray = useFieldArray({ control: form.control, name: "quotes" });

  useEffect(() => {
    if (!open) return;
    form.reset({
      supplierId,
      projectId: "",
      title: "",
      phase: "execution",
      requestedBy: "Procurement",
      notes: "",
      quotes: [{ supplierLabel: supplierName, amount: 0, currency: "USD", etaDays: 14, notes: "" }],
    });
  }, [form, open, supplierId, supplierName]);

  const mutation = useMutation({
    mutationFn: (values: PurchaseRequestValues) => createPurchaseRequestAction(values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to create purchase request");
        return;
      }
      toast.success("Purchase request created");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["supplier-workspace", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: () => toast.error("Failed to create purchase request"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New purchase request</DialogTitle>
          <DialogDescription>
            Start a procurement request for {supplierName} with quote comparison.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <input type="hidden" {...form.register("supplierId")} />

          <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="grid gap-2">
              <Label>Phase</Label>
              <select className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("phase")}>
                <option value="discovery">Discovery</option>
                <option value="design">Design</option>
                <option value="approval">Approval</option>
                <option value="execution">Execution</option>
                <option value="handover">Handover</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Request title</Label>
              <Input placeholder="Electrical panel procurement" {...form.register("title")} />
            </div>
            <div className="grid gap-2">
              <Label>Requested by</Label>
              <Input placeholder="Procurement lead" {...form.register("requestedBy")} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quotes</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => quotesArray.append({ supplierLabel: "", amount: 0, currency: "USD", etaDays: 14, notes: "" })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add quote
              </Button>
            </div>

            {quotesArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-2xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Quote {index + 1}</p>
                  {quotesArray.fields.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => quotesArray.remove(index)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Vendor label" {...form.register(`quotes.${index}.supplierLabel`)} />
                  <div className="flex gap-2">
                    <Input type="number" step={0.01} placeholder="Amount" {...form.register(`quotes.${index}.amount`, { valueAsNumber: true })} />
                    <Input placeholder="USD" maxLength={3} {...form.register(`quotes.${index}.currency`)} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="ETA days" {...form.register(`quotes.${index}.etaDays`, { valueAsNumber: true })} />
                  <Input placeholder="Notes" {...form.register(`quotes.${index}.notes`)} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <textarea
              className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Delivery constraints, payment milestones"
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
