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
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  localizedValue,
  localizeProcurementStatus,
  localizeProjectStage,
  localizeSupplierCategory,
} from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

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
  const { locale } = useLocale();
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
      toast.error(localizedValue(locale, { en: "Failed to update request status", he: "עדכון סטטוס הבקשה נכשל" }));
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to update request status", he: "עדכון סטטוס הבקשה נכשל" }));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["supplier-workspace", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(localizedValue(locale, { en: "Request status updated", he: "סטטוס הבקשה עודכן" }));
    },
  });

  const timelineItems = useMemo(() => {
    const timeline = workspaceQuery.data?.timeline || [];
    return timeline.map((item) => ({
      id: item.id,
      label: item.title,
      description: item.description,
      timestamp: formatDateTime(locale, item.timestamp),
      color: item.kind === "request_updated" ? "blue" as const : "emerald" as const,
    }));
  }, [locale, workspaceQuery.data?.timeline]);

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
      <EmptyState title={localizedValue(locale, { en: "Supplier not found", he: "הספק לא נמצא" })} description={localizedValue(locale, { en: "The supplier could not be loaded.", he: "לא ניתן לטעון את הספק." })} />
    );
  }

  const supplier = workspaceQuery.data;
  const projects = projectsQuery.data || [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        {localizedValue(locale, { en: "Back to suppliers", he: "חזרה לספקים" })}
      </Link>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{localizeSupplierCategory(locale, supplier.category)}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{supplier.name}</h1>
            <p className="mt-1 text-sm text-muted">{supplier.city || localizedValue(locale, { en: "No city set", he: "לא הוגדרה עיר" })} · {supplier.email || localizedValue(locale, { en: "No email", he: "ללא אימייל" })}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLinkDialogOpen(true)}>
              {localizedValue(locale, { en: "Link project", he: "קשר לפרויקט" })}
            </Button>
            <Button onClick={() => setRequestDialogOpen(true)}>{localizedValue(locale, { en: "New request", he: "בקשה חדשה" })}</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Star className="h-4 w-4 text-amber-500" />} label={localizedValue(locale, { en: "Reliability", he: "אמינות" })} value={supplier.performance.reliabilityRating.toFixed(1)} />
          <MetricCard icon={<Handshake className="h-4 w-4 text-emerald-500" />} label={localizedValue(locale, { en: "Approval rate", he: "שיעור אישור" })} value={`${supplier.performance.approvalRate}%`} />
          <MetricCard icon={<ClipboardList className="h-4 w-4 text-blue-500" />} label={localizedValue(locale, { en: "Delivered rate", he: "שיעור אספקה" })} value={`${supplier.performance.deliveredRate}%`} />
          <MetricCard icon={<Briefcase className="h-4 w-4 text-violet-500" />} label={localizedValue(locale, { en: "Avg quote", he: "הצעת מחיר ממוצעת" })} value={formatCurrency(locale, Math.round(supplier.performance.averageQuote))} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Related projects", he: "פרויקטים קשורים" })}</h2>
          {supplier.relatedProjects.length === 0 ? (
            <p className="text-sm text-muted">{localizedValue(locale, { en: "No projects linked yet.", he: "עדיין אין פרויקטים מקושרים." })}</p>
          ) : (
            <ul className="space-y-2">
              {supplier.relatedProjects.map((link) => (
                <li key={`${link.projectId}-${link.attachedAt.toString()}`} className="rounded-2xl border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{link.projectName}</p>
                  <p className="text-xs text-muted">{localizedValue(locale, { en: "Project stage", he: "שלב פרויקט" })}: {localizeProjectStage(locale, link.projectStage)}</p>
                  <p className="text-xs text-muted">{localizedValue(locale, { en: "Assigned phase", he: "פאזה משויכת" })}: {link.assignedPhase}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Pricing history", he: "היסטוריית מחירים" })}</h2>
          {supplier.pricingHistory.length === 0 ? (
            <p className="text-sm text-muted">{localizedValue(locale, { en: "No pricing records yet.", he: "עדיין אין רשומות מחיר." })}</p>
          ) : (
            <ul className="space-y-2">
              {supplier.pricingHistory.map((price) => (
                <li key={price.requestId} className="flex items-center justify-between rounded-2xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{price.title}</p>
                    <p className="text-xs text-muted">{formatDate(locale, price.occurredAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(locale, price.amount, price.currency)}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[price.status]}`}>{localizeProcurementStatus(locale, price.status)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Procurement workflow", he: "זרימת עבודה לרכש" })}</h2>
          <p className="text-xs text-muted">{localizedValue(locale, { en: "Requested → Approved → Ordered → Delivered", he: "התבקש → אושר → הוזמן → סופק" })}</p>
        </div>

        {supplier.requests.length === 0 ? (
          <EmptyState title={localizedValue(locale, { en: "No requests yet", he: "עדיין אין בקשות" })} description={localizedValue(locale, { en: "Create procurement requests to track ordering lifecycle.", he: "צור בקשות רכש כדי לעקוב אחר מחזור ההזמנה." })} />
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
                      {localizeProcurementStatus(locale, request.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {request.quotes.map((quote) => (
                      <div key={quote.id} className={`rounded-xl border p-2 ${request.selectedQuoteId === quote.id ? "border-emerald-300 bg-emerald-50/40" : "border-border"}`}>
                        <p className="text-xs text-muted">{quote.supplierLabel}</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(locale, quote.amount, quote.currency)}</p>
                        <p className="text-xs text-muted">{localizedValue(locale, { en: "ETA", he: "זמן אספקה" })} {quote.etaDays ?? "-"} {localizedValue(locale, { en: "days", he: "ימים" })}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted">{localizedValue(locale, { en: "Best quote", he: "הצעה מיטבית" })}: {selectedQuote ? formatCurrency(locale, selectedQuote.amount, selectedQuote.currency) : localizedValue(locale, { en: "N/A", he: "לא זמין" })}</p>
                    <div className="flex gap-2">
                      {request.status !== "rejected" && request.status !== "delivered" && nextStatus && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ requestId: request.id, status: nextStatus, selectedQuoteId: selectedQuote?.id })}
                          disabled={statusMutation.isPending}
                        >
                          {localizedValue(locale, { en: "Mark", he: "סמן" })} {localizeProcurementStatus(locale, nextStatus)}
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
                          {localizedValue(locale, { en: "Reject", he: "דחה" })}
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
          <h2 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Transaction and involvement timeline", he: "ציר זמן של עסקאות ומעורבות" })}</h2>
        </div>
        {timelineItems.length === 0 ? (
          <EmptyState title={localizedValue(locale, { en: "No timeline activity", he: "אין פעילות בציר הזמן" })} description={localizedValue(locale, { en: "Project links and procurement updates appear here.", he: "קישורי פרויקטים ועדכוני רכש יופיעו כאן." })} />
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
