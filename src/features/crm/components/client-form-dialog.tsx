"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { ClientProfile } from "@/features/crm/types";
import { ClientFormValues, clientFormSchema } from "@/features/crm/validation";
import { createClientLifecycleAction, updateClientLifecycleAction } from "@/actions/crm";
import { crmQueryKeys } from "@/features/crm/query-keys";

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialClient?: ClientProfile;
};

const defaultValues: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  status: "prospect",
  industry: "",
  website: "",
};

export function ClientFormDialog({
  open,
  onOpenChange,
  mode,
  initialClient,
}: ClientFormDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === "edit" && initialClient) {
      form.reset({
        name: initialClient.name,
        email: initialClient.email,
        phone: initialClient.phone || "",
        status: initialClient.status,
        industry: initialClient.industry || "",
        website: initialClient.website || "",
      });
    }

    if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [form, initialClient, mode, open]);

  const mutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      if (mode === "edit" && initialClient) {
        return updateClientLifecycleAction(initialClient.id, values);
      }

      return createClientLifecycleAction(values);
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.clientsRoot });
      const previous = queryClient.getQueriesData({ queryKey: crmQueryKeys.clientsRoot });

      queryClient.setQueriesData({ queryKey: crmQueryKeys.clientsRoot }, (current: unknown) => {
        if (!current || typeof current !== "object") return current;

        const data = current as {
          items?: Array<Record<string, unknown>>;
          total?: number;
        };

        if (!Array.isArray(data.items)) return current;

        if (mode === "edit" && initialClient) {
          return {
            ...data,
            items: data.items.map((client) =>
              client.id === initialClient.id
                ? { ...client, ...values }
                : client,
            ),
          };
        }

        const optimisticClient = {
          id: `optimistic-${Date.now()}`,
          ...values,
          projectCount: 0,
          invoiceCount: 0,
          totalSpent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          ...data,
          total: (data.total || 0) + 1,
          items: [optimisticClient, ...data.items],
        };
      });

      return { previous };
    },
    onError: (_error, _values, context) => {
      context?.previous?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      toast.error("Failed to save client");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to save client");
        return;
      }

      toast.success(mode === "create" ? "Client created" : "Client updated");
      onOpenChange(false);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.clientsRoot });
      queryClient.invalidateQueries({ queryKey: ["client-lifecycle"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create client" : "Edit client"}</DialogTitle>
          <DialogDescription>
            Capture complete CRM profile data for lifecycle workflows.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-2">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" type="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input id="client-phone" {...form.register("phone")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-status">Status</Label>
              <select
                id="client-status"
                className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                {...form.register("status")}
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client-industry">Industry</Label>
              <Input id="client-industry" {...form.register("industry")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-website">Website</Label>
              <Input id="client-website" {...form.register("website")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : mode === "create" ? "Create client" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
