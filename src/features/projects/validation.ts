import { z } from "zod";

// ── Project form ────────────────────────────────────────────────────────────

export const projectFormSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  stage: z.enum(["discovery", "design", "approval", "execution", "handover"]),
  status: z.enum(["planning", "active", "on_hold", "completed", "archived"]),
  budget: z.number().min(0, "Budget must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

// ── Task form ────────────────────────────────────────────────────────────────

export const taskFormSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

// ── Comment form ────────────────────────────────────────────────────────────

export const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

// ── Milestone form ──────────────────────────────────────────────────────────

export const milestoneFormSchema = z.object({
  title: z.string().min(2, "Milestone title required"),
  targetDate: z.string().min(1, "Target date required"),
  description: z.string().optional(),
});

export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;
