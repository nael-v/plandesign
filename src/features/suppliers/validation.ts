import { z } from "zod";

export const supplierCategorySchema = z.enum([
  "electrical",
  "furniture",
  "materials",
  "plumbing",
  "contractors",
]);

export const projectPhaseSchema = z.enum([
  "discovery",
  "design",
  "approval",
  "execution",
  "handover",
]);

export const procurementStatusSchema = z.enum([
  "requested",
  "approved",
  "rejected",
  "ordered",
  "delivered",
]);

export const supplierFormSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  category: supplierCategorySchema,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().max(1500, "Notes must be shorter than 1500 characters").optional(),
});

export const supplierProjectLinkSchema = z.object({
  supplierId: z.string().min(1),
  projectId: z.string().min(1, "Project is required"),
  phase: projectPhaseSchema,
  notes: z.string().max(600, "Notes must be shorter than 600 characters").optional(),
});

export const purchaseQuoteSchema = z.object({
  supplierLabel: z.string().min(2, "Quote vendor label is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().min(3).max(3),
  etaDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(500).optional(),
});

export const purchaseRequestSchema = z.object({
  supplierId: z.string().min(1),
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(3, "Request title is required"),
  phase: projectPhaseSchema,
  requestedBy: z.string().min(2, "Requester is required"),
  notes: z.string().max(1000).optional(),
  quotes: z.array(purchaseQuoteSchema).min(1, "At least one quote is required"),
});

export const purchaseRequestStatusSchema = z.object({
  requestId: z.string().min(1),
  status: procurementStatusSchema,
  approvedBy: z.string().optional(),
  selectedQuoteId: z.string().optional(),
  notes: z.string().max(600).optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
export type SupplierProjectLinkValues = z.infer<typeof supplierProjectLinkSchema>;
export type PurchaseRequestValues = z.infer<typeof purchaseRequestSchema>;
export type PurchaseRequestStatusValues = z.infer<typeof purchaseRequestStatusSchema>;
