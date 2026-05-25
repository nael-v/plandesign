"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, Briefcase, ClipboardList, Handshake, Star } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { listProjectsForSupplierAssignments, getSupplierProfile } from "@/services/suppliers.service";
import { updatePurchaseRequestStatusAction } from "@/actions/suppliers";
import { PurchaseRequestDialog } from "@/features/suppliers/components/purchase-request-dialog";
import { SupplierProjectLinkDialog } from "@/features/suppliers/components/supplier-project-link-dialog";
import type { ProcurementStatus, SupplierProfile } from "@/features/suppliers/types";

type Props = { supplierId: string };

const STATUS_STYLES: Record<ProcurementStatus, string> = {
  requested: "bg-slate-100 text-slate-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  ordered: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const STATUS_FLOW: ProcurementStatus[] = ["requested", "approved", "ordered", "delivered"];

export function SupplierWorkspace({ supplierId }: Props) {
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: ["supplier-workspace", supplierId],
    queryFn: () => getSupplierProfile(supplierId),
    staleTime: 1000 * 30,
  });

  const projectsQuery = useQuery({
    queryKey: ["supplier-project-options"],
    queryFn: () => listProjectsForSupplierAssignments(),
    staleTime: 1000 * 60,
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { requestId: string; status: ProcurementStatus; selectedQuoteId?: string }) =>
      updatePurchaseRequestStatusAction(payload),
    onMutate: async ({ requestId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["supplier-workspace", supplierId] });
      const previous = queryClient.getQueryData<SupplierProfile | null>(["supplier-workspace", supplierId]);
      queryClient.setQueryData<SupplierProfile | null>(["supplier-workspace", supplierId], (current) => {
        if (!current?.requests) return current;
        return {
          ...current,
          requests: current.requests.map((request) =>
            request.id === requestId ? { ...request, status, updatedAt: new Date() } : request,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["supplier-workspace", supplierId], ctx.previous);
      toast.error("Failed to update request status");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to update request status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["supplier-workspace", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Request status updated");
    },
  });

  const timelineItems = useMemo(() => {
    const timeline = workspaceQuery.data?.timeline || [];
    return timeline.map((item) => ({
      id: item.id,
      label: item.title,
      description: item.description,
      timestamp: new Date(item.timestamp).toLocaleString(),
      color: item.kind === "request_updated" ? "blue" as const : "emerald" as const,
    }));
  }, [workspaceQuery.data?.timeline]);

  if (workspaceQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <EmptyState title="Supplier not found" description="The supplier could not be loaded." />
    );
  }

  const supplier = workspaceQuery.data;
  const projects = projectsQuery.data || [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to suppliers
      </Link>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{supplier.category}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{supplier.name}</h1>
            <p className="mt-1 text-sm text-muted">{supplier.city || "No city set"} · {supplier.email || "No email"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLinkDialogOpen(true)}>
              Link project
            </Button>
            <Button onClick={() => setRequestDialogOpen(true)}>New request</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Star className="h-4 w-4 text-amber-500" />} label="Reliability" value={supplier.performance.reliabilityRating.toFixed(1)} />
          <MetricCard icon={<Handshake className="h-4 w-4 text-emerald-500" />} label="Approval rate" value={`${supplier.performance.approvalRate}%`} />
          <MetricCard icon={<ClipboardList className="h-4 w-4 text-blue-500" />} label="Delivered rate" value={`${supplier.performance.deliveredRate}%`} />
          <MetricCard icon={<Briefcase className="h-4 w-4 text-violet-500" />} label="Avg quote" value={`$${Math.round(supplier.performance.averageQuote).toLocaleString()}`} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Related projects</h2>
          {supplier.relatedProjects.length === 0 ? (
            <p className="text-sm text-muted">No projects linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {supplier.relatedProjects.map((link) => (
                <li key={`${link.projectId}-${link.attachedAt.toString()}`} className="rounded-2xl border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{link.projectName}</p>
                  <p className="text-xs text-muted">Project stage: {link.projectStage}</p>
                  <p className="text-xs text-muted">Assigned phase: {link.assignedPhase}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pricing history</h2>
          {supplier.pricingHistory.length === 0 ? (
            <p className="text-sm text-muted">No pricing records yet.</p>
          ) : (
            <ul className="space-y-2">
              {supplier.pricingHistory.map((price) => (
                <li key={price.requestId} className="flex items-center justify-between rounded-2xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{price.title}</p>
                    <p className="text-xs text-muted">{new Date(price.occurredAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{price.currency} {price.amount.toLocaleString()}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[price.status]}`}>{price.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Procurement workflow</h2>
          <p className="text-xs text-muted">Requested → Approved → Ordered → Delivered</p>
        </div>

        {supplier.requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Create procurement requests to track ordering lifecycle." />
        ) : (
          <div className="space-y-3">
            {supplier.requests.map((request) => {
              const nextStatus = STATUS_FLOW[Math.max(STATUS_FLOW.indexOf(request.status), 0) + 1];
              const selectedQuote = request.quotes.find((q) => q.id === request.selectedQuoteId) || request.quotes[0];
              return (
                <div key={request.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{request.title}</p>
                      <p className="text-xs text-muted">{request.projectName} · {request.phase} · {request.requestedBy}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[request.status]}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {request.quotes.map((quote) => (
                      <div key={quote.id} className={`rounded-xl border p-2 ${request.selectedQuoteId === quote.id ? "border-emerald-300 bg-emerald-50/40" : "border-border"}`}>
                        <p className="text-xs text-muted">{quote.supplierLabel}</p>
                        <p className="text-sm font-semibold text-foreground">{quote.currency} {quote.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted">ETA {quote.etaDays ?? "-"} days</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted">Best quote: {selectedQuote ? `${selectedQuote.currency} ${selectedQuote.amount.toLocaleString()}` : "N/A"}</p>
                    <div className="flex gap-2">
                      {request.status !== "rejected" && request.status !== "delivered" && nextStatus && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ requestId: request.id, status: nextStatus, selectedQuoteId: selectedQuote?.id })}
                          disabled={statusMutation.isPending}
                        >
                          Mark {nextStatus}
                        </Button>
                      )}
                      {request.status === "requested" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => statusMutation.mutate({ requestId: request.id, status: "rejected" })}
                          disabled={statusMutation.isPending}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-foreground">Transaction and involvement timeline</h2>
        </div>
        {timelineItems.length === 0 ? (
          <EmptyState title="No timeline activity" description="Project links and procurement updates appear here." />
        ) : (
          <ActivityTimeline title="" items={timelineItems} />
        )}
      </section>

      <PurchaseRequestDialog
        supplierId={supplierId}
        supplierName={supplier.name}
        projects={projects}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />
      <SupplierProjectLinkDialog
        supplierId={supplierId}
        supplierName={supplier.name}
        projects={projects}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-3">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
