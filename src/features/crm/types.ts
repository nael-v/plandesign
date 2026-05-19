export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "prospect";
  industry?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithMetadata extends ClientProfile {
  projectCount: number;
  invoiceCount: number;
  totalSpent: number;
  lastInteractionDate?: Date;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ClientMeeting {
  id: string;
  clientId: string;
  title: string;
  startsAt: Date;
  duration: number;
  room?: string;
  attendees: string[];
}

export interface ClientActivityItem {
  id: string;
  eventType: string;
  title: string;
  description: string;
  actor: string;
  createdAt: Date;
}

export interface CreateClientNoteInput {
  clientId: string;
  content: string;
}

export interface UploadClientFileInput {
  clientId: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface ScheduleClientMeetingInput {
  clientId: string;
  title: string;
  startsAt: string;
  duration: number;
  room?: string;
  attendeeIds?: string[];
}

export interface CreateClientInvoiceInput {
  clientId: string;
  projectId?: string;
  amount: number;
  dueAt?: string;
}

export interface ClientLifecycleSnapshot {
  client: ClientProfile;
  notes: ClientNote[];
  files: ClientFile[];
  meetings: ClientMeeting[];
  projects: Array<{ id: string; name: string; stage: string; status: string }>;
  invoices: Array<{ id: string; number: string; amount: number; status: string; dueAt?: Date }>;
  activities: ClientActivityItem[];
}

export interface ClientListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: "active" | "inactive" | "prospect";
  sortBy?: "name" | "createdAt" | "projectCount";
  sortOrder?: "asc" | "desc";
}

export interface ClientListResponse {
  items: ClientWithMetadata[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateClientInput = Omit<ClientProfile, "id" | "createdAt" | "updatedAt">;
export type UpdateClientInput = Partial<CreateClientInput>;
