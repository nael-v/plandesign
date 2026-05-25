"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createNotification, logActivity } from "@/services/activity.service";
import {
  ProjectListResponse,
  ProjectListQuery,
  ProjectSummary,
  ProjectDetail,
  CreateProjectInput,
  UpdateProjectInput,
  KanbanColumn,
  ProjectStage,
  ProjectStatus,
  ProjectActivity,
  CreateProjectTaskInput,
  MoveProjectTaskInput,
  AddProjectCommentInput,
  UploadProjectFileInput,
  AssignProjectMemberInput,
  AttachProjectSupplierInput,
  ProjectCommentItem,
  ProjectAttachmentItem,
  ProjectLifecycleSnapshot,
} from "@/features/projects/types";

export async function listProjects(query: ProjectListQuery): Promise<ProjectListResponse> {
  try {
    const { page, pageSize, search, status, stage, clientId, sortBy = "startDate", sortOrder = "desc" } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProjectWhereInput = {};
    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await db.project.count({ where });

    const projects = await db.project.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
    });

    const items: ProjectSummary[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      stage: p.stage as ProjectStage,
      status: p.status as ProjectStatus,
      budget: Number(p.budget),
      spent: Number(p.spent),
      clientId: p.clientId || "",
      clientName: p.client?.name || "Unassigned",
      startDate: p.startDate || undefined,
      endDate: p.endDate || undefined,
      progress: p.progress,
    }));

    return { items, total, page, pageSize };
  } catch (error) {
    console.error("Failed to list projects:", error);
    throw error;
  }
}

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  try {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        members: {
          include: { user: { select: { name: true, email: true } } },
        },
        tasks: true,
      },
    });

    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      stage: project.stage as ProjectStage,
      status: project.status as ProjectStatus,
      budget: Number(project.budget),
      spent: Number(project.spent),
      clientId: project.clientId || "",
      clientName: project.client?.name || "Unassigned",
      startDate: project.startDate || undefined,
      endDate: project.endDate || undefined,
      progress: project.progress,
      description: project.description || undefined,
      location: project.location || undefined,
      members: project.members.map((m) => ({
        id: m.userId,
        name: m.user.name || "",
        email: m.user.email,
        role: m.role,
      })),
      suppliers: [],
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        status: t.status as "todo" | "in_progress" | "review" | "done",
        priority: t.priority as "low" | "medium" | "high" | "urgent",
        assignee: t.assigneeId || undefined,
        dueDate: t.dueAt || undefined,
        progress: 50,
      })),
      activities: [],
    };
  } catch (error) {
    console.error("Failed to get project:", error);
    throw error;
  }
}

export async function createProject(input: CreateProjectInput): Promise<ProjectSummary> {
  try {
    const project = await db.project.create({
      data: {
        name: input.name,
        clientId: input.clientId,
        stage: input.stage,
        status: input.status,
        budget: input.budget,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        progress: 5,
      },
      include: { client: { select: { name: true } } },
    });

    await logActivity({
      eventType: "project_created",
      entityType: "project",
      entityId: project.id,
      title: `Project created: ${project.name}`,
      description: `Project initialized at stage ${project.stage}`,
      clientId: project.clientId || undefined,
      projectId: project.id,
      actorName: "PM",
    });

    return {
      id: project.id,
      name: project.name,
      stage: project.stage as ProjectStage,
      status: project.status as ProjectStatus,
      budget: Number(project.budget),
      spent: 0,
      clientId: project.clientId || "",
      clientName: project.client?.name || "Unassigned",
      startDate: project.startDate || undefined,
      endDate: project.endDate || undefined,
      progress: 0,
    };
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<ProjectSummary> {
  try {
    const project = await db.project.update({
      where: { id },
      data: input,
      include: { client: { select: { name: true } } },
    });

    return {
      id: project.id,
      name: project.name,
      stage: project.stage as ProjectStage,
      status: project.status as ProjectStatus,
      budget: Number(project.budget),
      spent: Number(project.spent),
      clientId: project.clientId || "",
      clientName: project.client?.name || "Unassigned",
      startDate: project.startDate || undefined,
      endDate: project.endDate || undefined,
      progress: project.progress,
    };
  } catch (error) {
    console.error("Failed to update project:", error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await db.project.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

export async function getProjectsByStage(): Promise<KanbanColumn[]> {
  try {
    const stages: ProjectStage[] = ["discovery", "design", "approval", "execution", "handover"];

    const columns: KanbanColumn[] = await Promise.all(
      stages.map(async (stage) => {
        const projects = await db.project.findMany({
          where: { stage, status: "active" },
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        });

        return {
          stage,
          label: stage.charAt(0).toUpperCase() + stage.slice(1),
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            stage: p.stage as ProjectStage,
            status: p.status as ProjectStatus,
            budget: Number(p.budget),
            spent: Number(p.spent),
            clientId: p.clientId || "",
            clientName: p.client?.name || "Unassigned",
            startDate: p.startDate || undefined,
            endDate: p.endDate || undefined,
            progress: p.progress,
          })),
        };
      }),
    );

    return columns;
  } catch (error) {
    console.error("Failed to get projects by stage:", error);
    throw error;
  }
}

export async function getProjectActivities(projectId: string): Promise<ProjectActivity[]> {
  try {
    const events = await db.activityEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return events.map((event) => ({
      id: event.id,
      type: mapEventTypeToProjectActivity(event.eventType),
      description: event.description,
      actor: event.actorName || "System",
      timestamp: event.createdAt,
      metadata: (event.metadata as Record<string, unknown> | null) || undefined,
    }));
  } catch (error) {
    console.error("Failed to get project activities:", error);
    return [];
  }
}

function mapEventTypeToProjectActivity(eventType: string): ProjectActivity["type"] {
  if (eventType === "comment_added") return "comment";
  if (eventType === "member_assigned") return "member_added";
  if (eventType === "task_moved" || eventType === "task_created") return "task_update";
  if (eventType === "project_created") return "stage_change";
  return "task_update";
}

export async function createProjectFromWizard(input: CreateProjectInput & { memberIds?: string[] }) {
  const project = await db.project.create({
    data: {
      name: input.name,
      clientId: input.clientId,
      stage: input.stage,
      status: input.status,
      budget: input.budget,
      spent: 0,
      progress: 0,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      members: {
        create: (input.memberIds || []).map((memberId) => ({
          userId: memberId,
          role: "member",
        })),
      },
    },
  });

  await logActivity({
    eventType: "project_created",
    entityType: "project",
    entityId: project.id,
    title: "Project created via wizard",
    description: `${project.name} is now in planning workflow`,
    clientId: project.clientId || undefined,
    projectId: project.id,
    actorName: "PM",
  });

  return project;
}

export async function assignProjectMember(input: AssignProjectMemberInput) {
  const member = await db.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: input.userId,
        projectId: input.projectId,
      },
    },
    create: {
      userId: input.userId,
      projectId: input.projectId,
      role: input.role || "member",
    },
    update: { role: input.role || "member" },
    include: { user: { select: { name: true } }, project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "member_assigned",
    entityType: "project",
    entityId: input.projectId,
    title: "Team member assigned",
    description: `${member.user.name || "Team member"} assigned as ${member.role}`,
    projectId: input.projectId,
    clientId: member.project.clientId || undefined,
    actorName: "PM",
  });

  return member;
}

export async function createProjectTask(input: CreateProjectTaskInput) {
  const task = await db.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "todo",
      assigneeId: input.assigneeId,
      dueAt: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: { project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "task_created",
    entityType: "task",
    entityId: task.id,
    title: "Task created",
    description: task.title,
    projectId: task.projectId || undefined,
    clientId: task.project?.clientId || undefined,
    taskId: task.id,
    actorName: "PM",
  });

  return task;
}

export async function moveProjectTask(input: MoveProjectTaskInput) {
  const task = await db.task.update({
    where: { id: input.taskId },
    data: { status: input.status },
    include: { project: { select: { id: true, clientId: true } } },
  });

  await logActivity({
    eventType: "task_moved",
    entityType: "task",
    entityId: task.id,
    title: "Task moved",
    description: `${task.title} moved to ${task.status.replace("_", " ")}`,
    projectId: task.project?.id || undefined,
    clientId: task.project?.clientId || undefined,
    taskId: task.id,
    actorName: "Team",
  });

  return task;
}

export async function attachProjectSupplier(input: AttachProjectSupplierInput) {
  const link = await db.projectSupplier.upsert({
    where: {
      projectId_supplierId: {
        projectId: input.projectId,
        supplierId: input.supplierId,
      },
    },
    create: {
      projectId: input.projectId,
      supplierId: input.supplierId,
      assignedPhase: "execution",
      notes: input.notes,
    },
    update: { assignedPhase: "execution", notes: input.notes },
    include: { project: { select: { clientId: true } }, supplier: { select: { name: true } } },
  });

  await logActivity({
    eventType: "supplier_attached",
    entityType: "project",
    entityId: input.projectId,
    title: "Supplier attached",
    description: `${link.supplier.name} linked to project`,
    projectId: input.projectId,
    clientId: link.project.clientId || undefined,
    actorName: "Operations",
  });

  return link;
}

export async function uploadProjectFile(input: UploadProjectFileInput): Promise<ProjectAttachmentItem> {
  const file = await db.attachment.create({
    data: {
      ownerType: "project",
      projectId: input.projectId,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url || `/uploads/projects/${input.projectId}/${Date.now()}-${input.name}`,
    },
    include: { project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "file_uploaded",
    entityType: "file",
    entityId: file.id,
    title: "Project document uploaded",
    description: file.name,
    projectId: input.projectId,
    clientId: file.project?.clientId || undefined,
    actorName: "Team",
  });

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    url: file.url,
    uploadedAt: file.createdAt,
  };
}

export async function addProjectComment(input: AddProjectCommentInput): Promise<ProjectCommentItem> {
  const comment = await db.projectComment.create({
    data: {
      projectId: input.projectId,
      content: input.content,
      authorName: "Team",
    },
    include: { project: { select: { clientId: true } } },
  });

  await logActivity({
    eventType: "comment_added",
    entityType: "project",
    entityId: input.projectId,
    title: "Project comment",
    description: input.content.slice(0, 160),
    projectId: input.projectId,
    clientId: comment.project.clientId || undefined,
    actorName: "Team",
  });

  await createNotification({
    title: "New project comment",
    message: `A new discussion item was added to project workflow.`,
    type: "info",
    entityType: "project",
    entityId: input.projectId,
  });

  return {
    id: comment.id,
    content: comment.content,
    author: comment.authorName || "Team",
    createdAt: comment.createdAt,
  };
}

export async function getProjectComments(projectId: string): Promise<ProjectCommentItem[]> {
  const comments = await db.projectComment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    author: comment.authorName || "Team",
    createdAt: comment.createdAt,
  }));
}

export async function getProjectAttachments(projectId: string): Promise<ProjectAttachmentItem[]> {
  const attachments = await db.attachment.findMany({
    where: { projectId, ownerType: "project" },
    orderBy: { createdAt: "desc" },
  });

  return attachments.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    url: file.url,
    uploadedAt: file.createdAt,
  }));
}

export async function getProjectTaskBoard(projectId: string) {
  const tasks = await db.task.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    todo: tasks.filter((task) => task.status === "todo"),
    in_progress: tasks.filter((task) => task.status === "in_progress"),
    review: tasks.filter((task) => task.status === "review"),
    done: tasks.filter((task) => task.status === "done"),
  };
}

export async function getProjectLifecycleSnapshot(projectId: string): Promise<ProjectLifecycleSnapshot | null> {
  const project = await getProjectById(projectId);
  if (!project) {
    return null;
  }

  const [comments, attachments] = await Promise.all([
    getProjectComments(projectId),
    getProjectAttachments(projectId),
  ]);

  return {
    project,
    comments,
    attachments,
  };
}