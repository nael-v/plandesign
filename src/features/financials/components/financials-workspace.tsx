"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CreditCard, DollarSign, FileWarning, HandCoins, Plus, ReceiptText, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedStatCard } from "@/components/animated-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFinanceFormOptions, getFinancialWorkspaceSnapshot } from "@/services/financials.service";
import { deleteInvoiceAction, updateInvoiceStatusAction, updateSupplierPaymentStatusAction } from "@/actions/financials";
import { ExpenseFormDialog } from "@/features/financials/components/expense-form-dialog";
import { InvoiceFormDialog } from "@/features/financials/components/invoice-form-dialog";
import { SupplierPaymentDialog } from "@/features/financials/components/supplier-payment-dialog";
import type { FinancialInvoice, FinancialWorkspaceSnapshot, SupplierPaymentRecord, SupplierPaymentStatus } from "@/features/financials/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  localizedValue,
  localizeInvoiceStatus,
  localizePaymentStatus,
} from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const INVOICE_STATUS_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  canceled: "bg-zinc-200 text-zinc-700",
};

const PAYMENT_STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function FinancialsWorkspace() {
  const { locale } = useLocale();
  const queryClient = useQueryClient();

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FinancialInvoice | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [supplierPaymentDialogOpen, setSupplierPaymentDialogOpen] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: ["financials", "workspace"],
    queryFn: () => getFinancialWorkspaceSnapshot(),
    staleTime: 1000 * 30,
  });

  const optionsQuery = useQuery({
    queryKey: ["financials", "options"],
    queryFn: () => getFinanceFormOptions(),
    staleTime: 1000 * 60 * 10,
  });

  const invoiceStatusMutation = useMutation({
    mutationFn: (payload: { invoiceId: string; status: FinancialInvoice["status"] }) =>
      updateInvoiceStatusAction(payload),
    onMutate: async ({ invoiceId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["financials", "workspace"] });
      const previous = queryClient.getQueryData<FinancialWorkspaceSnapshot>(["financials", "workspace"]);

      queryClient.setQueryData<FinancialWorkspaceSnapshot>(["financials", "workspace"], (current) => {
        if (!current) return current;
        return {
          ...current,
          invoices: current.invoices.map((invoice: FinancialInvoice) =>
            invoice.id === invoiceId ? { ...invoice, status } : invoice,
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["financials", "workspace"], ctx.previous);
      toast.error("Failed to update invoice status");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to update invoice status", he: "עדכון סטטוס החשבונית נכשל" }));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success(localizedValue(locale, { en: "Invoice status updated", he: "סטטוס החשבונית עודכן" }));
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => deleteInvoiceAction(invoiceId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to delete invoice", he: "מחיקת החשבונית נכשלה" }));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success(localizedValue(locale, { en: "Invoice deleted", he: "החשבונית נמחקה" }));
    },
    onError: () => toast.error(localizedValue(locale, { en: "Failed to delete invoice", he: "מחיקת החשבונית נכשלה" })),
  });

  const supplierPaymentStatusMutation = useMutation({
    mutationFn: (payload: { paymentId: string; status: SupplierPaymentStatus }) => updateSupplierPaymentStatusAction(payload),
    onMutate: async ({ paymentId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["financials", "workspace"] });
      const previous = queryClient.getQueryData<FinancialWorkspaceSnapshot>(["financials", "workspace"]);

      queryClient.setQueryData<FinancialWorkspaceSnapshot>(["financials", "workspace"], (current) => {
        if (!current) return current;
        return {
          ...current,
          supplierPayments: current.supplierPayments.map((payment: SupplierPaymentRecord) =>
            payment.id === paymentId ? { ...payment, status } : payment,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["financials", "workspace"], ctx.previous);
      toast.error(localizedValue(locale, { en: "Failed to update supplier payment status", he: "עדכון סטטוס תשלום הספק נכשל" }));
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to update supplier payment status", he: "עדכון סטטוס תשלום הספק נכשל" }));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success(localizedValue(locale, { en: "Supplier payment updated", he: "תשלום הספק עודכן" }));
    },
  });

  const filteredInvoices = useMemo(() => {
    const items = workspaceQuery.data?.invoices || [];
    if (!invoiceSearch.trim()) return items;
    const search = invoiceSearch.toLowerCase();
    return items.filter((invoice) => {
      return (
        invoice.number.toLowerCase().includes(search)
        || invoice.clientName?.toLowerCase().includes(search)
        || invoice.projectName?.toLowerCase().includes(search)
      );
    });
  }, [workspaceQuery.data?.invoices, invoiceSearch]);

  const filteredExpenses = useMemo(() => {
    const items = workspaceQuery.data?.expenses || [];
    if (!expenseSearch.trim()) return items;
    const search = expenseSearch.toLowerCase();
    return items.filter((expense) => {
      return (
        expense.label.toLowerCase().includes(search)
        || expense.projectName?.toLowerCase().includes(search)
        || expense.supplierName?.toLowerCase().includes(search)
      );
    });
  }, [workspaceQuery.data?.expenses, expenseSearch]);

  const timelineItems = useMemo(() => {
    const items = workspaceQuery.data?.timeline || [];
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      timestamp: formatDateTime(locale, item.timestamp),
      color: item.kind === "invoice" ? "blue" as const : item.kind === "supplier_payment" ? "amber" as const : "emerald" as const,
    }));
  }, [locale, workspaceQuery.data?.timeline]);

  if (workspaceQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState title={localizedValue(locale, { en: "Could not load Financials workspace", he: "לא ניתן לטעון את סביבת הפיננסים" })} description={localizedValue(locale, { en: "Try again shortly.", he: "נסה שוב בעוד רגע." })} />
      </main>
    );
  }

  const snapshot = workspaceQuery.data;
  const options = optionsQuery.data;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Financials"
        title={localizedValue(locale, { en: "Financial operating system", he: "מערכת הפעלה פיננסית" })}
        description={localizedValue(locale, { en: "Revenue, costs, supplier settlements, and profitability intelligence across CRM, Projects, and Suppliers.", he: "הכנסות, עלויות, הסדרי ספקים ותובנות רווחיות על פני CRM, פרויקטים וספקים." })}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {localizedValue(locale, { en: "Expense", he: "הוצאה" })}
            </Button>
            <Button variant="ghost" onClick={() => setSupplierPaymentDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {localizedValue(locale, { en: "Supplier payment", he: "תשלום ספק" })}
            </Button>
            <Button onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {localizedValue(locale, { en: "Invoice", he: "חשבונית" })}
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard label={localizedValue(locale, { en: "Total revenue", he: "סה" + '"' + "כ הכנסות" })} value={formatCurrency(locale, snapshot.stats.totalRevenue)} icon={DollarSign} color="emerald" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Monthly revenue", he: "הכנסה חודשית" })} value={formatCurrency(locale, snapshot.stats.monthlyRevenue)} icon={TrendingUp} color="blue" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Total expenses", he: "סה" + '"' + "כ הוצאות" })} value={formatCurrency(locale, snapshot.stats.totalExpenses)} icon={ReceiptText} color="amber" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Net profit", he: "רווח נקי" })} value={formatCurrency(locale, snapshot.stats.netProfit)} icon={TrendingUp} color={snapshot.stats.netProfit >= 0 ? "emerald" : "red"} />
        <AnimatedStatCard label={localizedValue(locale, { en: "Pending invoices", he: "חשבוניות ממתינות" })} value={snapshot.stats.pendingInvoices} icon={CreditCard} color="blue" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Overdue invoices", he: "חשבוניות באיחור" })} value={snapshot.stats.overdueInvoices} icon={FileWarning} color="red" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Supplier payments pending", he: "תשלומי ספק ממתינים" })} value={snapshot.stats.supplierPaymentsPending} icon={HandCoins} color="amber" />
        <AnimatedStatCard label={localizedValue(locale, { en: "Margin", he: "שיעור רווח" })} value={`${snapshot.stats.marginPercent}%`} icon={TrendingUp} color={snapshot.stats.marginPercent >= 0 ? "emerald" : "red"} />
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Monthly cash flow", he: "תזרים מזומנים חודשי" })}</h3>
        {snapshot.cashFlow.length === 0 ? (
          <EmptyState title={localizedValue(locale, { en: "No cash flow data", he: "אין נתוני תזרים" })} description={localizedValue(locale, { en: "Create invoices and expenses to unlock analytics.", he: "צור חשבוניות והוצאות כדי לפתוח אנליטיקה." })} />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(locale, Number(value || 0))} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Invoices", he: "חשבוניות" })}</h3>
          <Input
            className="max-w-xs"
            placeholder={localizedValue(locale, { en: "Search invoices", he: "חפש חשבוניות" })}
            value={invoiceSearch}
            onChange={(event) => setInvoiceSearch(event.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{localizedValue(locale, { en: "Invoice", he: "חשבונית" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Client / Project", he: "לקוח / פרויקט" })}</TableHead>
              <TableHead className="text-right">{localizedValue(locale, { en: "Total", he: "סה" + '"' + "כ" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Status", he: "סטטוס" })}</TableHead>
              <TableHead className="w-56 text-right">{localizedValue(locale, { en: "Actions", he: "פעולות" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title={localizedValue(locale, { en: "No invoices", he: "אין חשבוניות" })} description={localizedValue(locale, { en: "Create invoices to start revenue tracking.", he: "צור חשבוניות כדי להתחיל לעקוב אחרי הכנסות." })} />
                </TableCell>
              </TableRow>
            ) : filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{invoice.number}</p>
                  <p className="text-xs text-muted">{localizedValue(locale, { en: "Due", he: "לתשלום" })} {invoice.dueDate ? formatDate(locale, invoice.dueDate) : "-"}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{invoice.clientName || localizedValue(locale, { en: "No client", he: "ללא לקוח" })}</p>
                  <p className="text-xs text-muted">{invoice.projectName || localizedValue(locale, { en: "No project", he: "ללא פרויקט" })}</p>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(locale, invoice.totalAmount)}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs ${INVOICE_STATUS_BADGES[invoice.status]}`}>{localizeInvoiceStatus(locale, invoice.status)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingInvoice(invoice)}>{localizedValue(locale, { en: "Edit", he: "ערוך" })}</Button>
                    {invoice.status !== "paid" && <Button variant="ghost" size="sm" onClick={() => invoiceStatusMutation.mutate({ invoiceId: invoice.id, status: "paid" })}>{localizedValue(locale, { en: "Mark paid", he: "סמן כשולם" })}</Button>}
                    {invoice.status !== "canceled" && <Button variant="ghost" size="sm" onClick={() => invoiceStatusMutation.mutate({ invoiceId: invoice.id, status: "canceled" })}>{localizedValue(locale, { en: "Cancel", he: "בטל" })}</Button>}
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteInvoiceMutation.mutate(invoice.id)}>{localizedValue(locale, { en: "Delete", he: "מחק" })}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Expenses", he: "הוצאות" })}</h3>
          <Input
            className="max-w-xs"
            placeholder={localizedValue(locale, { en: "Search expenses", he: "חפש הוצאות" })}
            value={expenseSearch}
            onChange={(event) => setExpenseSearch(event.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{localizedValue(locale, { en: "Expense", he: "הוצאה" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Category", he: "קטגוריה" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Project / Supplier", he: "פרויקט / ספק" })}</TableHead>
              <TableHead className="text-right">{localizedValue(locale, { en: "Amount", he: "סכום" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}><EmptyState title={localizedValue(locale, { en: "No expenses", he: "אין הוצאות" })} description={localizedValue(locale, { en: "Track costs to reveal profitability.", he: "עקוב אחר עלויות כדי לחשוף רווחיות." })} /></TableCell>
              </TableRow>
            ) : filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">{expense.label}</p>
                  <p className="text-xs text-muted">{formatDate(locale, expense.occurredAt)}</p>
                </TableCell>
                <TableCell className="capitalize">{expense.category.replace("_", " ")}</TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{expense.projectName || localizedValue(locale, { en: "No project", he: "ללא פרויקט" })}</p>
                  <p className="text-xs text-muted">{expense.supplierName || localizedValue(locale, { en: "No supplier", he: "ללא ספק" })}</p>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(locale, expense.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Project profitability", he: "רווחיות פרויקט" })}</h3>
          {snapshot.projectHealth.length === 0 ? (
            <EmptyState title={localizedValue(locale, { en: "No project financial health", he: "אין נתוני בריאות פיננסית לפרויקטים" })} description={localizedValue(locale, { en: "Project-linked invoices and expenses will appear here.", he: "חשבוניות והוצאות המשויכות לפרויקט יופיעו כאן." })} />
          ) : (
            <div className="space-y-3">
              {snapshot.projectHealth.slice(0, 8).map((project) => (
                <div key={project.projectId} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{project.projectName}</p>
                    <span className="text-xs uppercase tracking-wide text-muted">{project.health}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div><p className="text-muted">{localizedValue(locale, { en: "Revenue", he: "הכנסות" })}</p><p className="font-medium">{formatCurrency(locale, project.revenue)}</p></div>
                    <div><p className="text-muted">{localizedValue(locale, { en: "Expenses", he: "הוצאות" })}</p><p className="font-medium">{formatCurrency(locale, project.expenses)}</p></div>
                    <div><p className="text-muted">{localizedValue(locale, { en: "Net", he: "נטו" })}</p><p className="font-medium">{formatCurrency(locale, project.netProfit)}</p></div>
                    <div><p className="text-muted">{localizedValue(locale, { en: "Margin", he: "שיעור רווח" })}</p><p className="font-medium">{project.marginPercent}%</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-background p-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Supplier payments", he: "תשלומי ספקים" })}</h3>
          {snapshot.supplierPayments.length === 0 ? (
            <EmptyState title={localizedValue(locale, { en: "No supplier payments", he: "אין תשלומי ספקים" })} description={localizedValue(locale, { en: "Record supplier settlements to monitor procurement cash flow.", he: "תעד הסדרי תשלום לספקים כדי לעקוב אחר תזרים הרכש." })} />
          ) : (
            <div className="space-y-2">
              {snapshot.supplierPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{payment.supplierName}</p>
                      <p className="text-xs text-muted">{payment.projectName || localizedValue(locale, { en: "No project", he: "ללא פרויקט" })} · {formatDate(locale, payment.occurredAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(locale, payment.amount)}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_BADGES[payment.status]}`}>{localizePaymentStatus(locale, payment.status)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    {payment.status !== "paid" && (
                      <Button size="sm" variant="ghost" onClick={() => supplierPaymentStatusMutation.mutate({ paymentId: payment.id, status: "paid" })}>
                        {localizedValue(locale, { en: "Mark paid", he: "סמן כשולם" })}
                      </Button>
                    )}
                    {payment.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => supplierPaymentStatusMutation.mutate({ paymentId: payment.id, status: "approved" })}>
                        {localizedValue(locale, { en: "Approve", he: "אשר" })}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Procurement cost summaries", he: "סיכומי עלויות רכש" })}</h3>
        {snapshot.procurementSummaries.length === 0 ? (
          <EmptyState title={localizedValue(locale, { en: "No procurement summaries yet", he: "עדיין אין סיכומי רכש" })} description={localizedValue(locale, { en: "Procurement requests from Suppliers module will aggregate here.", he: "בקשות רכש ממודול הספקים ירוכזו כאן." })} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.procurementSummaries.map((summary) => (
              <div key={summary.projectId} className="rounded-2xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">{summary.projectName}</p>
                <p className="text-xs text-muted">{localizedValue(locale, { en: `${summary.requestCount} requests`, he: `${summary.requestCount} בקשות` })}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(locale, summary.totalProcurementCost)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Financial activity timeline", he: "ציר פעילות פיננסית" })}</h3>
        </div>
        {timelineItems.length === 0 ? (
          <EmptyState title={localizedValue(locale, { en: "No financial activity", he: "אין פעילות פיננסית" })} description={localizedValue(locale, { en: "Invoice, expense, and payment activity appears here.", he: "פעילות של חשבוניות, הוצאות ותשלומים תופיע כאן." })} />
        ) : (
          <ActivityTimeline title="" items={timelineItems} />
        )}
      </section>

      {options && (
        <>
          <InvoiceFormDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            mode="create"
            clients={options.clients}
            projects={options.projects}
          />
          <InvoiceFormDialog
            open={Boolean(editingInvoice)}
            onOpenChange={(open) => {
              if (!open) setEditingInvoice(null);
            }}
            mode="edit"
            initialInvoice={editingInvoice || undefined}
            clients={options.clients}
            projects={options.projects}
          />
          <ExpenseFormDialog
            open={expenseDialogOpen}
            onOpenChange={setExpenseDialogOpen}
            projects={options.projects}
            suppliers={options.suppliers}
          />
          <SupplierPaymentDialog
            open={supplierPaymentDialogOpen}
            onOpenChange={setSupplierPaymentDialogOpen}
            suppliers={options.suppliers}
            projects={options.projects}
          />
        </>
      )}
    </main>
  );
}
