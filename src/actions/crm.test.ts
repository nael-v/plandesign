import {
  addClientNoteLifecycleAction,
  createClientLifecycleAction,
  createClientInvoiceLifecycleAction,
} from "@/actions/crm";

const serviceMocks = vi.hoisted(() => ({
  addClientNote: vi.fn(),
  createClient: vi.fn(),
  createClientInvoice: vi.fn(),
  createClientRelatedProject: vi.fn(),
  deleteClient: vi.fn(),
  scheduleClientMeeting: vi.fn(),
  updateClient: vi.fn(),
  uploadClientFile: vi.fn(),
}));

vi.mock("@/services/clients.service", () => serviceMocks);

describe("CRM server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation errors for malformed client payload", async () => {
    const result = await createClientLifecycleAction({
      name: "",
      email: "invalid",
      status: "active",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("creates a client when payload is valid", async () => {
    serviceMocks.createClient.mockResolvedValue({ id: "client_1", name: "Studio", email: "studio@example.com" });

    const result = await createClientLifecycleAction({
      name: "Studio",
      email: "studio@example.com",
      status: "active",
    });

    expect(result.success).toBe(true);
    expect(serviceMocks.createClient).toHaveBeenCalledTimes(1);
  });

  it("creates note and invoice through normalized payloads", async () => {
    serviceMocks.addClientNote.mockResolvedValue({ id: "note_1" });
    serviceMocks.createClientInvoice.mockResolvedValue({ id: "inv_1" });

    const noteResult = await addClientNoteLifecycleAction({
      clientId: "client_1",
      content: "Kickoff summary",
    });

    const invoiceResult = await createClientInvoiceLifecycleAction({
      clientId: "client_1",
      amount: 2500,
      dueAt: new Date().toISOString(),
    });

    expect(noteResult.success).toBe(true);
    expect(invoiceResult.success).toBe(true);
    expect(serviceMocks.addClientNote).toHaveBeenCalledWith({ clientId: "client_1", content: "Kickoff summary" });
  });
});
