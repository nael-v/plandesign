"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedStatCard } from "@/components/animated-stat-card";
import { createExpenseAction, createInvoiceAction, updateInvoiceStatusAction } from "@/actions/workflows";
import { getFinanceDashboard, listFinanceEntries, listInvoices } from "@/services/finances.service";

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState("materials");

  const dashboardQuery = useQuery({
    queryKey: ["finance", "dashboard"],
    queryFn: () => getFinanceDashboard(),
  });

  const entriesQuery = useQuery({
    queryKey: ["finance", "entries"],
    queryFn: () => listFinanceEntries(),
  });

  const invoicesQuery = useQuery({
    queryKey: ["finance", "invoices"],
    queryFn: () => listInvoices(),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: () =>
      createInvoiceAction({
        clientId: invoiceClientId,
        amount: invoiceAmount,
      }),
    onSuccess: () => {
      setInvoiceClientId("");
      setInvoiceAmount(0);
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: () =>
      createExpenseAction({
        label: expenseLabel,
        category: expenseCategory,
        amount: expenseAmount,
        occurredAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      setExpenseLabel("");
      setExpenseAmount(0);
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: string) => updateInvoiceStatusAction({ invoiceId, status: "paid" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const dashboard = dashboardQuery.data;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Finances"
        title="Financial workflow cockpit"
        description="Run invoices, expenses, and profitability from one production-ready workflow."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard label="Revenue (month)" value={`$${dashboard?.revenueThisMonth.toLocaleString() || 0}`} color="emerald" />
        <AnimatedStatCard label="Expenses (month)" value={`$${dashboard?.expensesThisMonth.toLocaleString() || 0}`} color="amber" />
        <AnimatedStatCard label="Profit (month)" value={`$${dashboard?.profitThisMonth.toLocaleString() || 0}`} color="blue" />
        <AnimatedStatCard label="Margin" value={`${dashboard?.marginPercent || 0}%`} color="red" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground">Create invoice</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Client ID"
              value={invoiceClientId}
              onChange={(event) => setInvoiceClientId(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={invoiceAmount || ""}
              onChange={(event) => setInvoiceAmount(Number(event.target.value || 0))}
            />
          </div>
          <Button className="mt-3" onClick={() => createInvoiceMutation.mutate()}>
            Create invoice
          </Button>
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground">Track expense</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Label"
              value={expenseLabel}
              onChange={(event) => setExpenseLabel(event.target.value)}
            />
            <Input
              placeholder="Category"
              value={expenseCategory}
              onChange={(event) => setExpenseCategory(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={expenseAmount || ""}
              onChange={(event) => setExpenseAmount(Number(event.target.value || 0))}
            />
          </div>
          <Button className="mt-3" onClick={() => createExpenseMutation.mutate()}>
            Log expense
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly analytics</h3>
        {dashboard?.monthly.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value || 0).toLocaleString()}`} />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No finance analytics yet" description="Create invoices and expenses to generate analytics." />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Invoice lifecycle</h3>
          <ul className="space-y-2">
            {invoicesQuery.data?.map((invoice) => (
              <li key={invoice.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{invoice.number}</p>
                    <p className="text-xs text-muted">{invoice.clientName || "No client"} • ${invoice.amount?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{invoice.status}</span>
                    {invoice.status !== "paid" && (
                      <Button size="sm" variant="secondary" onClick={() => markPaidMutation.mutate(invoice.id)}>
                        Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Income & expense ledger</h3>
          <ul className="space-y-2">
            {entriesQuery.data?.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{entry.label}</p>
                    <p className="text-xs text-muted">{entry.category || "general"} • {entry.occurredAt?.toLocaleDateString()}</p>
                  </div>
                  <span className={entry.kind === "income" ? "text-emerald-600" : "text-amber-600"}>
                    {entry.kind === "income" ? "+" : "-"}${entry.amount.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}