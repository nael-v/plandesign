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
        toast.error(result.error || "Failed to update invoice status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Invoice status updated");
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => deleteInvoiceAction(invoiceId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to delete invoice");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Failed to delete invoice"),
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
      toast.error("Failed to update supplier payment status");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to update supplier payment status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Supplier payment updated");
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
      timestamp: new Date(item.timestamp).toLocaleString(),
      color: item.kind === "invoice" ? "blue" as const : item.kind === "supplier_payment" ? "amber" as const : "emerald" as const,
    }));
  }, [workspaceQuery.data?.timeline]);

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
        <EmptyState title="Could not load Financials workspace" description="Try again shortly." />
      </main>
    );
  }

  const snapshot = workspaceQuery.data;
  const options = optionsQuery.data;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Financials"
        title="Financial operating system"
        description="Revenue, costs, supplier settlements, and profitability intelligence across CRM, Projects, and Suppliers."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Expense
            </Button>
            <Button variant="ghost" onClick={() => setSupplierPaymentDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Supplier payment
            </Button>
            <Button onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Invoice
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard label="Total revenue" value={`$${snapshot.stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" />
        <AnimatedStatCard label="Monthly revenue" value={`$${snapshot.stats.monthlyRevenue.toLocaleString()}`} icon={TrendingUp} color="blue" />
        <AnimatedStatCard label="Total expenses" value={`$${snapshot.stats.totalExpenses.toLocaleString()}`} icon={ReceiptText} color="amber" />
        <AnimatedStatCard label="Net profit" value={`$${snapshot.stats.netProfit.toLocaleString()}`} icon={TrendingUp} color={snapshot.stats.netProfit >= 0 ? "emerald" : "red"} />
        <AnimatedStatCard label="Pending invoices" value={snapshot.stats.pendingInvoices} icon={CreditCard} color="blue" />
        <AnimatedStatCard label="Overdue invoices" value={snapshot.stats.overdueInvoices} icon={FileWarning} color="red" />
        <AnimatedStatCard label="Supplier payments pending" value={snapshot.stats.supplierPaymentsPending} icon={HandCoins} color="amber" />
        <AnimatedStatCard label="Margin" value={`${snapshot.stats.marginPercent}%`} icon={TrendingUp} color={snapshot.stats.marginPercent >= 0 ? "emerald" : "red"} />
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Monthly cash flow</h3>
        {snapshot.cashFlow.length === 0 ? (
          <EmptyState title="No cash flow data" description="Create invoices and expenses to unlock analytics." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value || 0).toLocaleString()}`} />
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
          <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
          <Input
            className="max-w-xs"
            placeholder="Search invoices"
            value={invoiceSearch}
            onChange={(event) => setInvoiceSearch(event.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client / Project</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-56 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="No invoices" description="Create invoices to start revenue tracking." />
                </TableCell>
              </TableRow>
            ) : filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{invoice.number}</p>
                  <p className="text-xs text-muted">Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{invoice.clientName || "No client"}</p>
                  <p className="text-xs text-muted">{invoice.projectName || "No project"}</p>
                </TableCell>
                <TableCell className="text-right">${invoice.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs ${INVOICE_STATUS_BADGES[invoice.status]}`}>{invoice.status}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingInvoice(invoice)}>Edit</Button>
                    {invoice.status !== "paid" && <Button variant="ghost" size="sm" onClick={() => invoiceStatusMutation.mutate({ invoiceId: invoice.id, status: "paid" })}>Mark paid</Button>}
                    {invoice.status !== "canceled" && <Button variant="ghost" size="sm" onClick={() => invoiceStatusMutation.mutate({ invoiceId: invoice.id, status: "canceled" })}>Cancel</Button>}
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteInvoiceMutation.mutate(invoice.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Expenses</h3>
          <Input
            className="max-w-xs"
            placeholder="Search expenses"
            value={expenseSearch}
            onChange={(event) => setExpenseSearch(event.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Project / Supplier</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}><EmptyState title="No expenses" description="Track costs to reveal profitability." /></TableCell>
              </TableRow>
            ) : filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">{expense.label}</p>
                  <p className="text-xs text-muted">{new Date(expense.occurredAt).toLocaleDateString()}</p>
                </TableCell>
                <TableCell className="capitalize">{expense.category.replace("_", " ")}</TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{expense.projectName || "No project"}</p>
                  <p className="text-xs text-muted">{expense.supplierName || "No supplier"}</p>
                </TableCell>
                <TableCell className="text-right">${expense.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Project profitability</h3>
          {snapshot.projectHealth.length === 0 ? (
            <EmptyState title="No project financial health" description="Project-linked invoices and expenses will appear here." />
          ) : (
            <div className="space-y-3">
              {snapshot.projectHealth.slice(0, 8).map((project) => (
                <div key={project.projectId} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{project.projectName}</p>
                    <span className="text-xs uppercase tracking-wide text-muted">{project.health}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div><p className="text-muted">Revenue</p><p className="font-medium">${project.revenue.toLocaleString()}</p></div>
                    <div><p className="text-muted">Expenses</p><p className="font-medium">${project.expenses.toLocaleString()}</p></div>
                    <div><p className="text-muted">Net</p><p className="font-medium">${project.netProfit.toLocaleString()}</p></div>
                    <div><p className="text-muted">Margin</p><p className="font-medium">{project.marginPercent}%</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-background p-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Supplier payments</h3>
          {snapshot.supplierPayments.length === 0 ? (
            <EmptyState title="No supplier payments" description="Record supplier settlements to monitor procurement cash flow." />
          ) : (
            <div className="space-y-2">
              {snapshot.supplierPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{payment.supplierName}</p>
                      <p className="text-xs text-muted">{payment.projectName || "No project"} · {new Date(payment.occurredAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">${payment.amount.toLocaleString()}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_BADGES[payment.status]}`}>{payment.status}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    {payment.status !== "paid" && (
                      <Button size="sm" variant="ghost" onClick={() => supplierPaymentStatusMutation.mutate({ paymentId: payment.id, status: "paid" })}>
                        Mark paid
                      </Button>
                    )}
                    {payment.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => supplierPaymentStatusMutation.mutate({ paymentId: payment.id, status: "approved" })}>
                        Approve
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
        <h3 className="mb-3 text-sm font-semibold text-foreground">Procurement cost summaries</h3>
        {snapshot.procurementSummaries.length === 0 ? (
          <EmptyState title="No procurement summaries yet" description="Procurement requests from Suppliers module will aggregate here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.procurementSummaries.map((summary) => (
              <div key={summary.projectId} className="rounded-2xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">{summary.projectName}</p>
                <p className="text-xs text-muted">{summary.requestCount} requests</p>
                <p className="mt-1 text-sm font-semibold text-foreground">${summary.totalProcurementCost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-foreground">Financial activity timeline</h3>
        </div>
        {timelineItems.length === 0 ? (
          <EmptyState title="No financial activity" description="Invoice, expense, and payment activity appears here." />
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
