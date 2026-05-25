export type FinanceEntry = {
  id: string;
  label: string;
  amount: number;
  kind: "income" | "expense";
  category?: string;
  occurredAt?: Date;
  projectName?: string;
  clientName?: string;
};

export type InvoiceSummary = {
  id: string;
  number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "canceled";
  amount?: number;
  clientName?: string;
  projectName?: string;
  dueAt?: Date;
  issuedAt?: Date;
};

export type RevenuePoint = {
  month: string;
  income: number;
  expenses: number;
  profit: number;
};

export type FinanceDashboard = {
  revenueThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
  marginPercent: number;
  openInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  monthly: RevenuePoint[];
};

export type CreateInvoiceInput = {
  clientId: string;
  projectId?: string;
  amount: number;
  dueAt?: string;
};

export type UpdateInvoiceStatusInput = {
  invoiceId: string;
  status: "draft" | "sent" | "paid" | "overdue" | "canceled";
};

export type CreateExpenseInput = {
  label: string;
  category:
    | "materials"
    | "labor"
    | "logistics"
    | "furniture"
    | "permits"
    | "equipment"
    | "supplier_payment"
    | "other";
  amount: number;
  occurredAt: string;
  clientId?: string;
  projectId?: string;
  notes?: string;
};