export type ProjectStage = "discovery" | "design" | "approval" | "execution" | "handover";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export interface ProjectSummary {
  id: string;
  name: string;
  stage: ProjectStage;
  status: ProjectStatus;
  budget: number;
  spent: number;
  clientId: string;
  clientName: string;
  startDate?: Date;
  endDate?: Date;
  progress: number;
}

export interface ProjectDetail extends ProjectSummary {
  description?: string;
  location?: string;
  members: ProjectMember[];
  suppliers: ProjectSupplier[];
  tasks: ProjectTask[];
  activities: ProjectActivity[];
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface ProjectSupplier {
  id: string;
  name: string;
  category: string;
  contact: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: Date;
  progress: number;
}

export interface ProjectCommentItem {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface ProjectAttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface ProjectActivity {
  id: string;
  type: "stage_change" | "task_update" | "member_added" | "budget_updated" | "comment";
  description: string;
  actor: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateProjectTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId?: string;
  dueDate?: string;
}

export interface MoveProjectTaskInput {
  taskId: string;
  status: "todo" | "in_progress" | "review" | "done";
}

export interface AddProjectCommentInput {
  projectId: string;
  content: string;
}

export interface AttachProjectSupplierInput {
  projectId: string;
  supplierId: string;
  notes?: string;
}

export interface UploadProjectFileInput {
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface AssignProjectMemberInput {
  projectId: string;
  userId: string;
  role?: string;
}

export interface ProjectLifecycleSnapshot {
  project: ProjectDetail;
  comments: ProjectCommentItem[];
  attachments: ProjectAttachmentItem[];
}

export interface ProjectListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatus;
  stage?: ProjectStage;
  clientId?: string;
  sortBy?: "name" | "startDate" | "progress" | "budget";
  sortOrder?: "asc" | "desc";
}

export interface ProjectListResponse {
  items: ProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface KanbanColumn {
  stage: ProjectStage;
  label: string;
  projects: ProjectSummary[];
}

export interface ProjectTimelineItem {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  stage: ProjectStage | string;
}

export type CreateProjectInput = {
  name: string;
  stage: ProjectStage;
  status: ProjectStatus;
  budget: number;
  clientId: string;
  startDate: string;
  endDate?: string;
};

export type UpdateProjectInput = Partial<
  Omit<CreateProjectInput, "startDate" | "endDate"> & {
    startDate?: Date;
    endDate?: Date;
  }
>;
