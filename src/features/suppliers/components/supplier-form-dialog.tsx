"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createSupplierAction, updateSupplierAction } from "@/actions/suppliers";
import { supplierFormSchema, SupplierFormValues } from "@/features/suppliers/validation";
import type { SupplierSummary } from "@/features/suppliers/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialSupplier?: SupplierSummary;
};

const DEFAULT_VALUES: SupplierFormValues = {
  name: "",
  category: "materials",
  email: "",
  phone: "",
  city: "",
  notes: "",
};

export function SupplierFormDialog({ open, onOpenChange, mode, initialSupplier }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialSupplier) {
      form.reset({
        name: initialSupplier.name,
        category: initialSupplier.category,
        email: initialSupplier.email || "",
        phone: initialSupplier.phone || "",
        city: initialSupplier.city || "",
        notes: "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, initialSupplier, form]);

  const mutation = useMutation({
    mutationFn: async (values: SupplierFormValues) => {
      if (mode === "edit" && initialSupplier) {
        return updateSupplierAction(initialSupplier.id, values);
      }
      return createSupplierAction(values);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to save supplier");
        return;
      }
      toast.success(mode === "create" ? "Supplier created" : "Supplier updated");
      onOpenChange(false);
      form.reset(DEFAULT_VALUES);
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      if (mode === "edit" && initialSupplier) {
        queryClient.invalidateQueries({ queryKey: ["supplier-workspace", initialSupplier.id] });
      }
    },
    onError: () => toast.error("Failed to save supplier"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New supplier" : "Edit supplier"}</DialogTitle>
          <DialogDescription>
            Manage vendor profile data, category fit, and procurement context.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-2">
            <Label htmlFor="s-name">Supplier name</Label>
            <Input id="s-name" placeholder="Atlas Materials" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="s-category">Category</Label>
              <select id="s-category" className="h-11 rounded-2xl border border-border bg-background px-3 text-sm" {...form.register("category")}>
                <option value="electrical">Electrical</option>
                <option value="furniture">Furniture</option>
                <option value="materials">Materials</option>
                <option value="plumbing">Plumbing</option>
                <option value="contractors">Contractors</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-city">City</Label>
              <Input id="s-city" placeholder="Tel Aviv" {...form.register("city")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" placeholder="sales@atlas.co" {...form.register("email")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" placeholder="+972-50-000-0000" {...form.register("phone")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s-notes">Notes</Label>
            <textarea
              id="s-notes"
              className="min-h-16 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Commercial terms, lead-time caveats, contact preferences"
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : mode === "create" ? "Create supplier" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
