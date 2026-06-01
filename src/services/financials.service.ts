"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import type {
  CashFlowPoint,
  CreateExpenseInput,
  CreateInvoiceInput,
  CreateSupplierPaymentInput,
  ExpenseListQuery,
  FinanceFormOptions,
  FinancialDashboardStats,
  FinancialExpense,
  FinancialInvoice,
  FinancialListQuery,
  FinancialTimelineItem,
  FinancialWorkspaceSnapshot,
  InvoiceStatus,
  ProjectFinancialHealth,
  ProjectProcurementSummary,
  SupplierPaymentRecord,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput,
  UpdateSupplierPaymentStatusInput,
} from "@/features/financials/types";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: { select: { name: true } };
    project: { select: { name: true } };
  };
}>;

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    project: { select: { name: true } };
    supplier: { select: { name: true } };
  };
}>;

function getMonthBounds(reference = new Date()) {
  return {
    start: new Date(reference.getFullYear(), reference.getMonth(), 1),
    end: new Date(reference.getFullYear(), reference.getMonth() + 1, 1),
  };
}

function scoreProjectHealth(marginPercent: number, budgetUsagePercent: number): ProjectFinancialHealth["health"] {
  if (marginPercent >= 25 && budgetUsagePercent <= 90) return "excellent";
  if (marginPercent >= 10 && budgetUsagePercent <= 100) return "healthy";
  if (marginPercent >= 0 && budgetUsagePercent <= 110) return "watch";
  return "critical";
}

function profitabilityScore(marginPercent: number, budgetUsagePercent: number) {
  const marginScore = Math.max(0, Math.min(100, marginPercent + 50));
  const budgetScore = Math.max(0, 120 - budgetUsagePercent);
  return Math.round(marginScore * 0.65 + budgetScore * 0.35);
}

function computeInvoiceTotals(input: Pick<CreateInvoiceInput, "subtotal" | "taxRate"> | Pick<UpdateInvoiceInput, "subtotal" | "taxRate">, fallback: { subtotal: number; taxRate: number }) {
  const subtotal = input.subtotal ?? fallback.subtotal;
  const taxRate = input.taxRate ?? fallback.taxRate;
  const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));
  return { subtotal, taxRate, taxAmount, totalAmount };
}

async function appendInvoiceHistory(invoiceId: string, status: InvoiceStatus, actor = "Finance") {
  await db.activityEvent.create({
    data: {
      eventType: "invoice_status_changed",
      entityType: "invoice",
      entityId: invoiceId,
      title: `Invoice status: ${status}`,
      description: `Status changed to ${status}`,
      invoiceId,
      actorName: actor,
      metadata: { status },
    },
  });
}

async function getInvoiceHistoryMap(invoiceIds: string[]) {
  if (!invoiceIds.length) return new Map<string, Array<{ at: Date; status: InvoiceStatus; actor?: string }>>();

  const events = await db.activityEvent.findMany({
    where: {
      entityType: "invoice",
      entityId: { in: invoiceIds },
      eventType: "invoice_status_changed",
    },
    orderBy: { createdAt: "asc" },
    select: {
      entityId: true,
      createdAt: true,
      actorName: true,
      metadata: true,
      description: true,
    },
  });

  const map = new Map<string, Array<{ at: Date; status: InvoiceStatus; actor?: string }>>();
  for (const event of events) {
    const metadata = event.metadata as Prisma.JsonObject | null;
    const status = (metadata?.status as InvoiceStatus | undefined) || (event.description?.split(" ").pop() as InvoiceStatus | undefined);
    if (!status) continue;

    const current = map.get(event.entityId) || [];
    current.push({ at: event.createdAt, status, actor: event.actorName || undefined });
    map.set(event.entityId, current);
  }

  return map;
}

function toInvoiceDTO(invoice: InvoiceWithRelations, history: Array<{ at: Date; status: InvoiceStatus; actor?: string }>): FinancialInvoice {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    clientId: invoice.clientId || undefined,
    clientName: invoice.client?.name || undefined,
    projectId: invoice.projectId || undefined,
    projectName: invoice.project?.name || undefined,
    issueDate: invoice.issuedAt || undefined,
    dueDate: invoice.dueAt || undefined,
    paymentDate: invoice.paymentDate || undefined,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    notes: invoice.notes || undefined,
    history,
  };
}

function toExpenseDTO(expense: ExpenseWithRelations): FinancialExpense {
  return {
    id: expense.id,
    label: expense.label,
    category: expense.category as FinancialExpense["category"],
    amount: Number(expense.amount),
    occurredAt: expense.occurredAt,
    projectId: expense.projectId || undefined,
    projectName: expense.project?.name || undefined,
    supplierId: expense.supplierId || undefined,
    supplierName: expense.supplier?.name || undefined,
    recurring: expense.recurring,
    receiptUrl: expense.receiptUrl || undefined,
    notes: expense.notes || undefined,
  };
}

function toSupplierPaymentDTO(expense: ExpenseWithRelations): SupplierPaymentRecord | null {
  if (!expense.supplierId || !expense.supplier) return null;

  return {
    id: expense.id,
    supplierId: expense.supplierId,
    supplierName: expense.supplier.name,
    projectId: expense.projectId || undefined,
    projectName: expense.project?.name || undefined,
    amount: Number(expense.amount),
    status: (expense.paymentStatus || "pending") as SupplierPaymentRecord["status"],
    occurredAt: expense.occurredAt,
    notes: expense.notes || undefined,
  };
}

export async function getFinanceFormOptions(): Promise<FinanceFormOptions> {
  const [clients, projects, suppliers] = await Promise.all([
    db.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { updatedAt: "desc" }, take: 300 }),
    db.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    clients: clients.map((item) => ({ id: item.id, label: item.name })),
    projects: projects.map((item) => ({ id: item.id, label: item.name })),
    suppliers: suppliers.map((item) => ({ id: item.id, label: item.name })),
  };
}

export async function listInvoices(query: FinancialListQuery): Promise<{ items: FinancialInvoice[]; total: number }> {
  const skip = (query.page - 1) * query.pageSize;
  const where: Prisma.InvoiceWhereInput = {};

  if (query.search) {
    where.OR = [
      { number: { contains: query.search, mode: "insensitive" } },
      { client: { name: { contains: query.search, mode: "insensitive" } } },
      { project: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.status) where.status = query.status;

  const [rows, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
    db.invoice.count({ where }),
  ]);

  const historyMap = await getInvoiceHistoryMap(rows.map((item) => item.id));
  return {
    items: rows.map((row) => toInvoiceDTO(row, historyMap.get(row.id) || [])),
    total,
  };
}

export async function listExpenses(query: ExpenseListQuery): Promise<{ items: FinancialExpense[]; total: number }> {
  const skip = (query.page - 1) * query.pageSize;
  const where: Prisma.ExpenseWhereInput = {};

  if (query.search) {
    where.OR = [
      { label: { contains: query.search, mode: "insensitive" } },
      { project: { name: { contains: query.search, mode: "insensitive" } } },
      { supplier: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.category) where.category = query.category;

  const [rows, total] = await Promise.all([
    db.expense.findMany({
      where,
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { occurredAt: "desc" },
      skip,
      take: query.pageSize,
    }),
    db.expense.count({ where }),
  ]);

  return { items: rows.map((row) => toExpenseDTO(row)), total };
}

export async function listSupplierPayments(): Promise<SupplierPaymentRecord[]> {
  const rows = await db.expense.findMany({
    where: { category: "supplier_payment" },
    include: {
      project: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return rows.map((row) => toSupplierPaymentDTO(row)).filter((item): item is SupplierPaymentRecord => Boolean(item));
}

export async function createInvoice(input: CreateInvoiceInput): Promise<FinancialInvoice> {
  const count = await db.invoice.count();
  const totals = computeInvoiceTotals(input, { subtotal: input.subtotal, taxRate: input.taxRate });

  const invoice = await db.invoice.create({
    data: {
      number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
      status: "draft",
      amount: totals.totalAmount,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes: input.notes,
      clientId: input.clientId || null,
      projectId: input.projectId || null,
      issuedAt: new Date(input.issueDate),
      dueAt: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });

  await appendInvoiceHistory(invoice.id, "draft");
  return toInvoiceDTO(invoice, [{ at: new Date(), status: "draft", actor: "Finance" }]);
}

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<FinancialInvoice> {
  const existing = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!existing) throw new Error("Invoice not found");

  const totals = computeInvoiceTotals(input, {
    subtotal: Number(existing.subtotal),
    taxRate: Number(existing.taxRate),
  });

  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      clientId: input.clientId === undefined ? undefined : input.clientId || null,
      projectId: input.projectId === undefined ? undefined : input.projectId || null,
      issuedAt: input.issueDate ? new Date(input.issueDate) : undefined,
      dueAt: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      amount: totals.totalAmount,
      notes: input.notes === undefined ? undefined : input.notes || null,
    },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });

  const historyMap = await getInvoiceHistoryMap([invoiceId]);
  return toInvoiceDTO(updated, historyMap.get(invoiceId) || []);
}

export async function deleteInvoice(invoiceId: string) {
  await db.invoice.delete({ where: { id: invoiceId } });
  return { success: true };
}

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput): Promise<FinancialInvoice> {
  const invoice = await db.invoice.findUnique({
    where: { id: input.invoiceId },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
  if (!invoice) throw new Error("Invoice not found");

  const updated = await db.invoice.update({
    where: { id: input.invoiceId },
    data: {
      status: input.status,
      paymentDate: input.status === "paid" ? (input.paymentDate ? new Date(input.paymentDate) : new Date()) : invoice.paymentDate,
      canceledAt: input.status === "canceled" ? new Date() : null,
    },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });

  await appendInvoiceHistory(input.invoiceId, input.status);
  const historyMap = await getInvoiceHistoryMap([input.invoiceId]);
  return toInvoiceDTO(updated, historyMap.get(input.invoiceId) || []);
}

export async function createExpense(input: CreateExpenseInput): Promise<FinancialExpense> {
  const created = await db.expense.create({
    data: {
      label: input.label,
      category: input.category,
      amount: input.amount,
      occurredAt: new Date(input.occurredAt),
      projectId: input.projectId || null,
      supplierId: input.supplierId || null,
      recurring: Boolean(input.recurring),
      receiptUrl: input.receiptUrl || null,
      notes: input.notes || null,
    },
    include: {
      project: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  return toExpenseDTO(created);
}

export async function createSupplierPayment(input: CreateSupplierPaymentInput): Promise<SupplierPaymentRecord> {
  const supplier = await db.supplier.findUnique({ where: { id: input.supplierId }, select: { name: true } });
  if (!supplier) throw new Error("Supplier not found");

  const created = await db.expense.create({
    data: {
      label: `Supplier payment · ${supplier.name}`,
      category: "supplier_payment",
      amount: input.amount,
      occurredAt: new Date(input.occurredAt),
      projectId: input.projectId || null,
      supplierId: input.supplierId,
      paymentStatus: input.status,
      notes: input.notes || null,
    },
    include: {
      project: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  const dto = toSupplierPaymentDTO(created);
  if (!dto) throw new Error("Failed to create supplier payment");
  return dto;
}

export async function updateSupplierPaymentStatus(input: UpdateSupplierPaymentStatusInput): Promise<SupplierPaymentRecord> {
  const updated = await db.expense.update({
    where: { id: input.paymentId },
    data: { paymentStatus: input.status },
    include: {
      project: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  const dto = toSupplierPaymentDTO(updated);
  if (!dto) throw new Error("Supplier payment not found");
  return dto;
}

export async function getProjectFinancialHealth(): Promise<ProjectFinancialHealth[]> {
  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true,
      budget: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const projectIds = projects.map((project) => project.id);
  const [invoiceRows, expenseRows] = await Promise.all([
    db.invoice.findMany({
      where: {
        projectId: { in: projectIds },
        status: "paid",
      },
      select: { projectId: true, totalAmount: true },
    }),
    db.expense.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, amount: true },
    }),
  ]);

  const revenueMap = new Map<string, number>();
  invoiceRows.forEach((row) => {
    if (!row.projectId) return;
    const previous = revenueMap.get(row.projectId) || 0;
    revenueMap.set(row.projectId, previous + Number(row.totalAmount));
  });

  const expenseMap = new Map<string, number>();
  expenseRows.forEach((row) => {
    if (!row.projectId) return;
    const previous = expenseMap.get(row.projectId) || 0;
    expenseMap.set(row.projectId, previous + Number(row.amount));
  });

  return projects.map((project) => {
    const budget = Number(project.budget);
    const revenue = revenueMap.get(project.id) || 0;
    const expenses = expenseMap.get(project.id) || 0;
    const netProfit = revenue - expenses;
    const marginPercent = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;
    const budgetUsagePercent = budget > 0 ? (expenses / budget) * 100 : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      budget,
      revenue,
      expenses,
      netProfit,
      marginPercent,
      profitabilityScore: profitabilityScore(marginPercent, budgetUsagePercent),
      health: scoreProjectHealth(marginPercent, budgetUsagePercent),
    };
  });
}

async function getProcurementSummaries(): Promise<ProjectProcurementSummary[]> {
  const requests = await db.procurementRequest.findMany({
    include: {
      project: { select: { id: true, name: true } },
      quotes: { select: { id: true, amount: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 800,
  });

  const map = new Map<string, ProjectProcurementSummary>();

  for (const request of requests) {
    const selected = request.quotes.find((quote) => quote.id === request.selectedQuoteId) || request.quotes[0];
    if (!selected) continue;

    const existing = map.get(request.project.id) || {
      projectId: request.project.id,
      projectName: request.project.name,
      totalProcurementCost: 0,
      requestCount: 0,
    };

    map.set(request.project.id, {
      ...existing,
      totalProcurementCost: existing.totalProcurementCost + Number(selected.amount),
      requestCount: existing.requestCount + 1,
    });
  }

  return Array.from(map.values());
}

export async function getFinancialDashboardStats(): Promise<FinancialDashboardStats> {
  const now = new Date();
  const { start, end } = getMonthBounds(now);

  const invoices = await db.invoice.findMany({
    select: { status: true, issuedAt: true, dueAt: true, totalAmount: true },
  });

  let totalRevenue = 0;
  let monthlyRevenue = 0;
  let pendingInvoices = 0;
  let overdueInvoices = 0;

  for (const invoice of invoices) {
    if (invoice.status === "paid") {
      totalRevenue += Number(invoice.totalAmount);
      if (invoice.issuedAt && invoice.issuedAt >= start && invoice.issuedAt < end) {
        monthlyRevenue += Number(invoice.totalAmount);
      }
    }

    if (invoice.status === "draft" || invoice.status === "sent") pendingInvoices += 1;
    const isOverdueByDate = (invoice.status === "draft" || invoice.status === "sent") && invoice.dueAt ? invoice.dueAt < now : false;
    if (invoice.status === "overdue" || isOverdueByDate) overdueInvoices += 1;
  }

  const expenseAggregate = await db.expense.aggregate({ _sum: { amount: true } });
  const totalExpenses = Number(expenseAggregate._sum.amount || 0);

  const supplierPayments = await listSupplierPayments();
  const supplierPaymentsPending = supplierPayments.filter((payment) => payment.status === "pending" || payment.status === "approved").length;

  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  return {
    totalRevenue,
    monthlyRevenue,
    totalExpenses,
    pendingInvoices,
    overdueInvoices,
    supplierPaymentsPending,
    netProfit,
    marginPercent,
  };
}

export async function getCashFlowSeries(): Promise<CashFlowPoint[]> {
  const now = new Date();
  const year = now.getFullYear();

  const invoices = await db.invoice.findMany({
    where: { status: "paid", issuedAt: { not: null } },
    select: { totalAmount: true, issuedAt: true },
  });

  const expenses = await db.expense.findMany({
    select: { amount: true, occurredAt: true },
  });

  const points: CashFlowPoint[] = [];
  for (let month = 0; month < 12; month += 1) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    const revenue = invoices
      .filter((invoice) => invoice.issuedAt && invoice.issuedAt >= monthStart && invoice.issuedAt < monthEnd)
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

    const monthlyExpenses = expenses
      .filter((expense) => expense.occurredAt >= monthStart && expense.occurredAt < monthEnd)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    points.push({
      month: monthStart.toLocaleDateString("en-US", { month: "short" }),
      revenue,
      expenses: monthlyExpenses,
      net: revenue - monthlyExpenses,
    });
  }

  return points;
}

export async function getFinancialTimeline(): Promise<FinancialTimelineItem[]> {
  const [invoices, expenses] = await Promise.all([
    db.invoice.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    db.expense.findMany({
      take: 25,
      orderBy: { occurredAt: "desc" },
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
  ]);

  const invoiceItems: FinancialTimelineItem[] = invoices.map((invoice) => ({
    id: `invoice-${invoice.id}`,
    label: `Invoice ${invoice.number}`,
    description: `${invoice.status.toUpperCase()} · ${invoice.client?.name || invoice.project?.name || "Unlinked"} · $${Number(invoice.totalAmount).toLocaleString()}`,
    timestamp: invoice.issuedAt || invoice.createdAt,
    kind: "invoice",
  }));

  const expenseItems: FinancialTimelineItem[] = expenses.map((expense) => ({
    id: `expense-${expense.id}`,
    label: expense.category === "supplier_payment" && expense.supplier?.name ? `Supplier payment · ${expense.supplier.name}` : expense.label,
    description: `${expense.category.toUpperCase()} · $${Number(expense.amount).toLocaleString()}${expense.project?.name ? ` · ${expense.project.name}` : ""}`,
    timestamp: expense.occurredAt,
    kind: expense.category === "supplier_payment" ? "supplier_payment" : "expense",
  }));

  return [...invoiceItems, ...expenseItems]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 40);
}

export async function getFinancialWorkspaceSnapshot(): Promise<FinancialWorkspaceSnapshot> {
  const [stats, cashFlow, invoiceResult, expenseResult, supplierPayments, projectHealth, procurementSummaries, timeline] = await Promise.all([
    getFinancialDashboardStats(),
    getCashFlowSeries(),
    listInvoices({ page: 1, pageSize: 60 }),
    listExpenses({ page: 1, pageSize: 60 }),
    listSupplierPayments(),
    getProjectFinancialHealth(),
    getProcurementSummaries(),
    getFinancialTimeline(),
  ]);

  return {
    stats,
    cashFlow,
    invoices: invoiceResult.items,
    expenses: expenseResult.items,
    supplierPayments,
    projectHealth,
    procurementSummaries,
    timeline,
  };
}
