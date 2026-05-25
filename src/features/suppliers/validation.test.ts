import {
  purchaseRequestSchema,
  purchaseRequestStatusSchema,
  supplierFormSchema,
  supplierProjectLinkSchema,
} from "@/features/suppliers/validation";

describe("Suppliers validation schemas", () => {
  it("accepts valid supplier payload", () => {
    const result = supplierFormSchema.safeParse({
      name: "Atlas Contracting",
      category: "contractors",
      email: "sales@atlas.example",
      phone: "+972501234567",
      city: "Haifa",
      notes: "Preferred for execution phase",
    });

    expect(result.success).toBe(true);
  });

  it("rejects supplier payload with invalid category", () => {
    const result = supplierFormSchema.safeParse({
      name: "Atlas",
      category: "hvac",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid supplier-project link payload", () => {
    const result = supplierProjectLinkSchema.safeParse({
      supplierId: "sup_1",
      projectId: "proj_1",
      phase: "design",
      notes: "Lead shop drawings",
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid procurement request payload", () => {
    const result = purchaseRequestSchema.safeParse({
      supplierId: "sup_1",
      projectId: "proj_1",
      title: "Lighting package",
      phase: "execution",
      requestedBy: "Procurement Lead",
      quotes: [
        {
          supplierLabel: "Atlas",
          amount: 12000,
          currency: "USD",
          etaDays: 21,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects procurement request without quotes", () => {
    const result = purchaseRequestSchema.safeParse({
      supplierId: "sup_1",
      projectId: "proj_1",
      title: "Lighting package",
      phase: "execution",
      requestedBy: "Procurement Lead",
      quotes: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid procurement status update", () => {
    const result = purchaseRequestStatusSchema.safeParse({
      requestId: "req_1",
      status: "approved",
      approvedBy: "Operations Manager",
      selectedQuoteId: "quote_1",
    });

    expect(result.success).toBe(true);
  });
});
