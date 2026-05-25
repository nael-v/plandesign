"use server";

import { z } from "zod";
import {
  addProjectComment,
  assignProjectMember,
  attachProjectSupplier,
  createProjectTask,
  moveProjectTask,
  uploadProjectFile,
} from "@/services/projects.service";
import {
  createExpense as createFinancialExpense,
  createInvoice as createFinancialInvoice,
  updateInvoiceStatus as updateFinancialInvoiceStatus,
} from "@/services/financials.service";
import { markNotificationRead } from "@/services/activity.service";
import { scheduleMeeting } from "@/services/meetings.service";

const fileSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  url: z.string().optional(),
});

const meetingSchema = z.object({
  title: z.string().min(2),
  startsAt: z.string().datetime(),
  duration: z.number().int().min(15).max(600),
  room: z.string().optional(),
  attendeeIds: z.array(z.string()).optional(),
});


const addTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["todo", "in_progress", "review", "done"]),
});

const assignMemberSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().optional(),
});

const addCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(2),
});

const addSupplierSchema = z.object({
  projectId: z.string().min(1),
  supplierId: z.string().min(1),
  notes: z.string().optional(),
});

const projectFileSchema = z.object({
  projectId: z.string().min(1),
}).merge(fileSchema);

const financeInvoiceSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  amount: z.number().positive(),
  dueAt: z.string().datetime().optional(),
});

const invoiceStatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["draft", "sent", "paid", "overdue", "canceled"]),
});

const expenseSchema = z.object({
  label: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().positive(),
  occurredAt: z.string().datetime(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
});

const notificationReadSchema = z.object({ id: z.string().min(1) });

function toActionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation error";
  }
  return "Action failed";
}

export async function addClientNoteAction() {
  const message = "Moved to actions/crm. Use addClientNoteLifecycleAction instead.";
  console.warn(message);
  return { success: false, error: message };
}

export async function uploadClientFileAction() {
  const message = "Moved to actions/crm. Use uploadClientFileLifecycleAction instead.";
  console.warn(message);
  return { success: false, error: message };
}

export async function scheduleClientMeetingAction() {
  const message = "Moved to actions/crm. Use scheduleClientMeetingLifecycleAction instead.";
  console.warn(message);
  return { success: false, error: message };
}

export async function createClientRelatedProjectAction() {
  const message = "Moved to actions/crm. Use createClientRelatedProjectLifecycleAction instead.";
  console.warn(message);
  return { success: false, error: message };
}

export async function createClientInvoiceAction() {
  const message = "Moved to actions/crm. Use createClientInvoiceLifecycleAction instead.";
  console.warn(message);
  return { success: false, error: message };
}

export async function assignProjectMemberAction(data: unknown) {
  try {
    const input = assignMemberSchema.parse(data);
    const result = await assignProjectMember(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function addProjectTaskAction(data: unknown) {
  try {
    const input = addTaskSchema.parse(data);
    const result = await createProjectTask(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function moveProjectTaskAction(data: unknown) {
  try {
    const input = moveTaskSchema.parse(data);
    const result = await moveProjectTask(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function uploadProjectFileAction(data: unknown) {
  try {
    const input = projectFileSchema.parse(data);
    const result = await uploadProjectFile(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function addProjectCommentAction(data: unknown) {
  try {
    const input = addCommentSchema.parse(data);
    const result = await addProjectComment(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function attachProjectSupplierAction(data: unknown) {
  try {
    const input = addSupplierSchema.parse(data);
    const result = await attachProjectSupplier(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function createInvoiceAction(data: unknown) {
  try {
    const input = financeInvoiceSchema.parse(data);
    const result = await createFinancialInvoice({
      clientId: input.clientId,
      projectId: input.projectId,
      issueDate: new Date().toISOString(),
      dueDate: input.dueAt,
      subtotal: input.amount,
      taxRate: 0,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateInvoiceStatusAction(data: unknown) {
  try {
    const input = invoiceStatusSchema.parse(data);
    const result = await updateFinancialInvoiceStatus(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function createExpenseAction(data: unknown) {
  try {
    const input = expenseSchema.parse(data);
    const result = await createFinancialExpense({
      label: input.label,
      category: input.category as
        | "materials"
        | "labor"
        | "logistics"
        | "furniture"
        | "permits"
        | "equipment"
        | "supplier_payment"
        | "other",
      amount: input.amount,
      occurredAt: input.occurredAt,
      projectId: input.projectId,
      notes: input.notes,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function scheduleMeetingAction(data: unknown) {
  try {
    const input = meetingSchema.extend({
      clientId: z.string().optional(),
      projectId: z.string().optional(),
    }).parse(data);
    const result = await scheduleMeeting(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function markNotificationReadAction(data: unknown) {
  try {
    const input = notificationReadSchema.parse(data);
    const result = await markNotificationRead(input.id);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
