import {
  expenseFormSchema,
  invoiceFormSchema,
  invoiceStatusUpdateSchema,
  supplierPaymentFormSchema,
} from "@/features/financials/validation";

describe("Financials validation schemas", () => {
  it("accepts valid invoice payload", () => {
    const result = invoiceFormSchema.safeParse({
      clientId: "client_1",
      projectId: "project_1",
      issueDate: "2026-05-24",
      dueDate: "2026-06-10",
      subtotal: 10000,
      taxRate: 17,
      notes: "Milestone billing",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid invoice subtotal", () => {
    const result = invoiceFormSchema.safeParse({
      issueDate: "2026-05-24",
      subtotal: -10,
      taxRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid invoice status update", () => {
    const result = invoiceStatusUpdateSchema.safeParse({
      invoiceId: "inv_1",
      status: "paid",
      paymentDate: "2026-05-24",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid expense payload", () => {
    const result = expenseFormSchema.safeParse({
      label: "Imported marble",
      category: "materials",
      amount: 3400,
      occurredAt: "2026-05-24",
      projectId: "project_2",
      notes: "Phase 2 stonework",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid supplier payment payload", () => {
    const result = supplierPaymentFormSchema.safeParse({
      supplierId: "supplier_1",
      projectId: "project_1",
      amount: 5200,
      status: "approved",
      occurredAt: "2026-05-24",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid supplier payment payload", () => {
    const result = supplierPaymentFormSchema.safeParse({
      supplierId: "",
      amount: -1,
      status: "done",
      occurredAt: "",
    });
    expect(result.success).toBe(false);
  });
});
