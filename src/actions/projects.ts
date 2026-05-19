"use server";

import { z } from "zod";
import { createProject, updateProject, deleteProject } from "@/services/projects.service";
import { CreateProjectInput, UpdateProjectInput } from "@/features/projects/types";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientId: z.string().min(1, "Client is required"),
  stage: z.enum(["discovery", "design", "approval", "execution", "handover"]),
  status: z.enum(["planning", "active", "on_hold", "completed", "archived"]),
  budget: z.number().min(0, "Budget must be positive"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

export async function createProjectAction(data: unknown) {
  try {
    const validated = createProjectSchema.parse(data);
    const project = await createProject(validated as CreateProjectInput);
    return { success: true, data: project };
  } catch (error) {
    console.error("Create project error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProjectAction(id: string, data: unknown) {
  try {
    const validated = updateProjectSchema.parse(data);
    const project = await updateProject(id, validated as UpdateProjectInput);
    return { success: true, data: project };
  } catch (error) {
    console.error("Update project error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    await deleteProject(id);
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, error: "Failed to delete project" };
  }
}
