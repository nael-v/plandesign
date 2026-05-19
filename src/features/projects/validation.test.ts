import {
  commentFormSchema,
  projectFormSchema,
  taskFormSchema,
} from "@/features/projects/validation";

describe("Projects validation schemas", () => {
  it("accepts a valid project payload", () => {
    const result = projectFormSchema.safeParse({
      name: "Skyline Residence Renovation",
      description: "Full architectural redesign",
      location: "Tel Aviv",
      clientId: "client_123",
      stage: "design",
      status: "active",
      budget: 250000,
      startDate: "2026-01-01",
      endDate: "2026-07-01",
    });

    expect(result.success).toBe(true);
  });

  it("rejects project payload with missing required fields", () => {
    const result = projectFormSchema.safeParse({
      name: "",
      clientId: "",
      stage: "design",
      status: "active",
      budget: -1,
      startDate: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid task payload", () => {
    const result = taskFormSchema.safeParse({
      title: "Coordinate MEP layout",
      description: "Confirm clash-free routing",
      priority: "high",
      assigneeId: "user_22",
      dueDate: "2026-03-04",
    });

    expect(result.success).toBe(true);
  });

  it("rejects task payload with invalid priority", () => {
    const result = taskFormSchema.safeParse({
      title: "Create render package",
      priority: "critical",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid comment payload", () => {
    const result = commentFormSchema.safeParse({ content: "Please review revision B." });
    expect(result.success).toBe(true);
  });

  it("rejects empty comment payload", () => {
    const result = commentFormSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});
