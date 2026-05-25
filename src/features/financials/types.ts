export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "canceled";

export type ExpenseCategory =
  | "materials"
  | "labor"
  | "logistics"
  | "furniture"
  | "permits"
  | "equipment"
  | "supplier_payment"
  | "other";

export type SupplierPaymentStatus = "pending" | "approved" | "paid" | "failed";

export interface FinancialDashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  pendingInvoices: number;
  overdueInvoices: number;
  supplierPaymentsPending: number;
  netProfit: number;
  marginPercent: number;
}

export interface CashFlowPoint {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface FinancialTimelineItem {
  id: string;
  label: string;
  description: string;
  timestamp: Date;
  kind: "invoice" | "expense" | "supplier_payment" | "project";
}

export interface FinancialInvoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  issueDate?: Date;
  dueDate?: Date;
  paymentDate?: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  history: Array<{ at: Date; status: InvoiceStatus; actor?: string }>;
}

export interface FinancialExpense {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  occurredAt: Date;
  projectId?: string;
  projectName?: string;
  supplierId?: string;
  supplierName?: string;
  recurring: boolean;
  receiptUrl?: string;
  notes?: string;
}

export interface SupplierPaymentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  status: SupplierPaymentStatus;
  occurredAt: Date;
  notes?: string;
}

export interface ProjectFinancialHealth {
  projectId: string;
  projectName: string;
  budget: number;
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPercent: number;
  profitabilityScore: number;
  health: "excellent" | "healthy" | "watch" | "critical";
}

export interface ProjectProcurementSummary {
  projectId: string;
  projectName: string;
  totalProcurementCost: number;
  requestCount: number;
}

export interface FinancialWorkspaceSnapshot {
  stats: FinancialDashboardStats;
  cashFlow: CashFlowPoint[];
  invoices: FinancialInvoice[];
  expenses: FinancialExpense[];
  supplierPayments: SupplierPaymentRecord[];
  projectHealth: ProjectFinancialHealth[];
  procurementSummaries: ProjectProcurementSummary[];
  timeline: FinancialTimelineItem[];
}

export interface FinancialListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: InvoiceStatus;
}

export interface ExpenseListQuery {
  page: number;
  pageSize: number;
  search?: string;
  category?: ExpenseCategory;
}

export interface FinanceFormOption {
  id: string;
  label: string;
}

export interface FinanceFormOptions {
  clients: FinanceFormOption[];
  projects: FinanceFormOption[];
  suppliers: FinanceFormOption[];
}

export interface CreateInvoiceInput {
  clientId?: string;
  projectId?: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxRate: number;
  notes?: string;
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

export interface UpdateInvoiceStatusInput {
  invoiceId: string;
  status: InvoiceStatus;
  paymentDate?: string;
}

export interface CreateExpenseInput {
  label: string;
  category: ExpenseCategory;
  amount: number;
  occurredAt: string;
  projectId?: string;
  supplierId?: string;
  recurring?: boolean;
  receiptUrl?: string;
  notes?: string;
}

export interface CreateSupplierPaymentInput {
  supplierId: string;
  projectId?: string;
  amount: number;
  status: SupplierPaymentStatus;
  occurredAt: string;
  notes?: string;
}

export interface UpdateSupplierPaymentStatusInput {
  paymentId: string;
  status: SupplierPaymentStatus;
}
