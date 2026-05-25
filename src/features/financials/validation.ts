import { z } from "zod";

export const invoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "canceled",
]);

export const expenseCategorySchema = z.enum([
  "materials",
  "labor",
  "logistics",
  "furniture",
  "permits",
  "equipment",
  "supplier_payment",
  "other",
]);

export const supplierPaymentStatusSchema = z.enum(["pending", "approved", "paid", "failed"]);

export const invoiceFormSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  subtotal: z.number().min(0, "Subtotal must be zero or greater"),
  taxRate: z.number().min(0, "Tax rate must be zero or greater").max(100, "Tax rate cannot exceed 100"),
  notes: z.string().max(2000, "Notes must be shorter than 2000 characters").optional(),
});

export const invoiceStatusUpdateSchema = z.object({
  invoiceId: z.string().min(1),
  status: invoiceStatusSchema,
  paymentDate: z.string().optional(),
});

export const expenseFormSchema = z.object({
  label: z.string().min(2, "Label must be at least 2 characters"),
  category: expenseCategorySchema,
  amount: z.number().positive("Amount must be greater than zero"),
  occurredAt: z.string().min(1, "Date is required"),
  projectId: z.string().optional(),
  supplierId: z.string().optional(),
  recurring: z.boolean().optional(),
  receiptUrl: z.string().url("Receipt URL must be valid").optional().or(z.literal("")),
  notes: z.string().max(1500, "Notes must be shorter than 1500 characters").optional(),
});

export const supplierPaymentFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  projectId: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  status: supplierPaymentStatusSchema,
  occurredAt: z.string().min(1, "Date is required"),
  notes: z.string().max(1500, "Notes must be shorter than 1500 characters").optional(),
});

export const supplierPaymentStatusUpdateSchema = z.object({
  paymentId: z.string().min(1),
  status: supplierPaymentStatusSchema,
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceStatusUpdateValues = z.infer<typeof invoiceStatusUpdateSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type SupplierPaymentFormValues = z.infer<typeof supplierPaymentFormSchema>;
export type SupplierPaymentStatusValues = z.infer<typeof supplierPaymentStatusUpdateSchema>;
