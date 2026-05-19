import {
  clientFormSchema,
  clientInvoiceSchema,
  clientMeetingSchema,
  clientNoteSchema,
} from "@/features/crm/validation";

describe("CRM validation schemas", () => {
  it("accepts a valid client form payload", () => {
    const result = clientFormSchema.safeParse({
      name: "Studio North",
      email: "team@studionorth.example",
      phone: "+1 555 123 999",
      status: "prospect",
      industry: "Architecture",
      website: "https://studionorth.example",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid note payload", () => {
    const result = clientNoteSchema.safeParse({ content: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid meeting payload", () => {
    const result = clientMeetingSchema.safeParse({
      title: "Kickoff",
      startsAt: "invalid-date",
      duration: 60,
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero-value invoice", () => {
    const result = clientInvoiceSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});
