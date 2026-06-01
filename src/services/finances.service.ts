"use server";

import { db } from "@/lib/server/db";
import {
  CreateExpenseInput,
  CreateInvoiceInput,
  FinanceDashboard,
  FinanceEntry,
  InvoiceSummary,
  UpdateInvoiceStatusInput,
} from "@/features/finances";
import { createNotification, logActivity } from "@/services/activity.service";

function getMonthBounds(reference = new Date()) {
  return {
    start: new Date(reference.getFullYear(), reference.getMonth(), 1),
    end: new Date(reference.getFullYear(), reference.getMonth() + 1, 1),
  };
}

export async function listFinanceEntries(): Promise<FinanceEntry[]> {
  const [invoices, expenses] = await Promise.all([
    db.invoice.findMany({
      where: { status: "paid" },
      orderBy: { issuedAt: "desc" },
      take: 30,
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    db.expense.findMany({
      orderBy: { occurredAt: "desc" },
      take: 30,
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
  ]);

  const incomeEntries: FinanceEntry[] = invoices.map((invoice) => ({
    id: invoice.id,
    label: invoice.number,
    amount: Number(invoice.amount),
    kind: "income",
    category: "invoice",
    occurredAt: invoice.issuedAt || invoice.createdAt,
    clientName: invoice.client?.name || undefined,
    projectName: invoice.project?.name || undefined,
  }));

  const expenseEntries: FinanceEntry[] = expenses.map((expense) => ({
    id: expense.id,
    label: expense.label,
    amount: Number(expense.amount),
    kind: "expense",
    category: expense.category,
    occurredAt: expense.occurredAt,
    clientName: expense.client?.name || undefined,
    projectName: expense.project?.name || undefined,
  }));

  return [...incomeEntries, ...expenseEntries].sort((a, b) => {
    const aTime = a.occurredAt ? a.occurredAt.getTime() : 0;
    const bTime = b.occurredAt ? b.occurredAt.getTime() : 0;
    return bTime - aTime;
  });
}

export async function listInvoices(): Promise<InvoiceSummary[]> {
  const invoices = await db.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
    take: 100,
  });

  return invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amount: Number(invoice.amount),
    clientName: invoice.client?.name || undefined,
    projectName: invoice.project?.name || undefined,
    dueAt: invoice.dueAt || undefined,
    issuedAt: invoice.issuedAt || undefined,
  }));
}

export async function createInvoice(input: CreateInvoiceInput) {
  const invoiceCount = await db.invoice.count();
  const invoice = await db.invoice.create({
    data: {
      number: `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`,
      status: "draft",
      amount: input.amount,
      clientId: input.clientId,
      projectId: input.projectId,
      issuedAt: new Date(),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
    include: { project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "invoice_created",
    entityType: "invoice",
    entityId: invoice.id,
    title: "Invoice created",
    description: `${invoice.number} drafted for $${Number(invoice.amount).toLocaleString()}`,
    invoiceId: invoice.id,
    clientId: invoice.clientId || undefined,
    projectId: invoice.projectId || undefined,
    actorName: "Finance",
  });

  await createNotification({
    title: "Invoice draft created",
    message: `${invoice.number} is ready for review and sending.`,
    type: "info",
    entityType: "invoice",
    entityId: invoice.id,
  });

  return invoice;
}

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput) {
  const invoice = await db.invoice.update({
    where: { id: input.invoiceId },
    data: { status: input.status },
    include: { project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "invoice_status_changed",
    entityType: "invoice",
    entityId: invoice.id,
    title: "Invoice status updated",
    description: `${invoice.number} marked as ${invoice.status}`,
    invoiceId: invoice.id,
    clientId: invoice.clientId || invoice.project?.clientId || undefined,
    projectId: invoice.projectId || undefined,
    actorName: "Finance",
  });

  return invoice;
}

export async function createExpense(input: CreateExpenseInput) {
  const expense = await db.expense.create({
    data: {
      label: input.label,
      category: input.category,
      amount: input.amount,
      occurredAt: new Date(input.occurredAt),
      clientId: input.clientId,
      projectId: input.projectId,
      notes: input.notes,
    },
    include: { project: { select: { clientId: true } } },
  });

  if (expense.projectId) {
    const totals = await db.expense.aggregate({
      where: { projectId: expense.projectId },
      _sum: { amount: true },
    });

    await db.project.update({
      where: { id: expense.projectId },
      data: { spent: Number(totals._sum.amount || 0) },
    });
  }

  await logActivity({
    eventType: "expense_logged",
    entityType: "project",
    entityId: expense.projectId || expense.id,
    title: "Expense recorded",
    description: `${expense.label} • $${Number(expense.amount).toLocaleString()}`,
    projectId: expense.projectId || undefined,
    clientId: expense.clientId || expense.project?.clientId || undefined,
    actorName: "Finance",
  });

  return expense;
}

export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const { start, end } = getMonthBounds();
  const year = start.getFullYear();

  const [paidInvoices, monthExpenses, invoiceCounts] = await Promise.all([
    db.invoice.aggregate({
      where: {
        status: "paid",
        issuedAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: {
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    db.invoice.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const revenueThisMonth = Number(paidInvoices._sum.amount || 0);
  const expensesThisMonth = Number(monthExpenses._sum.amount || 0);
  const profitThisMonth = revenueThisMonth - expensesThisMonth;
  const marginPercent = revenueThisMonth > 0 ? Math.round((profitThisMonth / revenueThisMonth) * 100) : 0;

  const monthly: FinanceDashboard["monthly"] = [];

  for (let month = 0; month < 12; month += 1) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    const [income, expenses] = await Promise.all([
      db.invoice.aggregate({
        where: {
          status: "paid",
          issuedAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { occurredAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
    ]);

    const incomeValue = Number(income._sum.amount || 0);
    const expenseValue = Number(expenses._sum.amount || 0);

    monthly.push({
      month: monthStart.toLocaleDateString("en-US", { month: "short" }),
      income: incomeValue,
      expenses: expenseValue,
      profit: incomeValue - expenseValue,
    });
  }

  return {
    revenueThisMonth,
    expensesThisMonth,
    profitThisMonth,
    marginPercent,
    openInvoices: invoiceCounts.find((group) => group.status === "sent")?._count._all || 0,
    overdueInvoices: invoiceCounts.find((group) => group.status === "overdue")?._count._all || 0,
    paidInvoices: invoiceCounts.find((group) => group.status === "paid")?._count._all || 0,
    monthly,
  };
}