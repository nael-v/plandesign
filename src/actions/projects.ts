"use server";

import { z } from "zod";
import {
  createProject,
  updateProject,
  deleteProject,
  createProjectTask,
  moveProjectTask,
  addProjectComment,
  uploadProjectFile,
  assignProjectMember,
  attachProjectSupplier,
} from "@/services/projects.service";
import type { CreateProjectInput, UpdateProjectInput } from "@/features/projects/types";
import { projectFormSchema } from "@/features/projects/validation";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toActionError(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message || "Validation error";
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

// ─── Project CRUD ────────────────────────────────────────────────────────────

export async function createProjectAction(data: unknown) {
  try {
    const values = projectFormSchema.parse(data);
    const project = await createProject(values as CreateProjectInput);
    return { success: true as const, data: project };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updateProjectAction(id: string, data: unknown) {
  try {
    const values = projectFormSchema.partial().parse(data);
    const project = await updateProject(id, values as UpdateProjectInput);
    return { success: true as const, data: project };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    if (!id) return { success: false as const, error: "Missing project id" };
    await deleteProject(id);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

// ─── Task lifecycle ──────────────────────────────────────────────────────────

const addTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["todo", "in_progress", "review", "done"]),
});

export async function addProjectTaskAction(data: unknown) {
  try {
    const input = addTaskSchema.parse(data);
    const result = await createProjectTask(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function moveProjectTaskAction(data: unknown) {
  try {
    const input = moveTaskSchema.parse(data);
    const result = await moveProjectTask(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

// ─── Comments ────────────────────────────────────────────────────────────────

const addCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export async function addProjectCommentAction(data: unknown) {
  try {
    const input = addCommentSchema.parse(data);
    const result = await addProjectComment(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

// ─── Files ───────────────────────────────────────────────────────────────────

const projectFileSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(0),
  url: z.string().optional(),
});

export async function uploadProjectFileAction(data: unknown) {
  try {
    const input = projectFileSchema.parse(data);
    const result = await uploadProjectFile(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

// ─── Team & suppliers ────────────────────────────────────────────────────────

const assignMemberSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().optional(),
});

const attachSupplierSchema = z.object({
  projectId: z.string().min(1),
  supplierId: z.string().min(1),
  notes: z.string().optional(),
});

export async function assignProjectMemberAction(data: unknown) {
  try {
    const input = assignMemberSchema.parse(data);
    const result = await assignProjectMember(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function attachProjectSupplierAction(data: unknown) {
  try {
    const input = attachSupplierSchema.parse(data);
    const result = await attachProjectSupplier(input);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}
