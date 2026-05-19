"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteClientLifecycleAction } from "@/actions/crm";
import { crmQueryKeys } from "@/features/crm/query-keys";

type ClientDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  clientName?: string;
};

export function ClientDeleteDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ClientDeleteDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!clientId) return { success: false, error: "Missing client id" };
      return deleteClientLifecycleAction({ id: clientId });
    },
    onMutate: async () => {
      if (!clientId) return;
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.clientsRoot });
      const previous = queryClient.getQueriesData({ queryKey: crmQueryKeys.clientsRoot });

      queryClient.setQueriesData({ queryKey: crmQueryKeys.clientsRoot }, (current: unknown) => {
        if (!current || typeof current !== "object") return current;
        const data = current as { items?: Array<Record<string, unknown>>; total?: number };
        if (!Array.isArray(data.items)) return current;

        return {
          ...data,
          total: Math.max(0, (data.total || 0) - 1),
          items: data.items.filter((client) => client.id !== clientId),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error("Failed to delete client");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to delete client");
        return;
      }

      toast.success("Client deleted");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.clientsRoot });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete client</DialogTitle>
          <DialogDescription>
            This will permanently remove {clientName || "this client"} and its lifecycle data references.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Deleting..." : "Delete client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
