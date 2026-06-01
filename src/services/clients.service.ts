"use server";

import { db } from "@/lib/server/db";
import { createNotification, logActivity } from "@/services/activity.service";
import {
  ClientListResponse,
  ClientListQuery,
  ClientProfile,
  ClientWithMetadata,
  CreateClientInput,
  UpdateClientInput,
  ClientNote,
  ClientMeeting,
  ClientFile,
  CreateClientInvoiceInput,
  CreateClientNoteInput,
  ScheduleClientMeetingInput,
  UploadClientFileInput,
  ClientLifecycleSnapshot,
  ClientActivityItem,
} from "@/features/crm/types";

export async function listClients(query: ClientListQuery): Promise<ClientListResponse> {
  try {
    const { page, pageSize, search, status, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      status?: string;
      OR?: Array<{ name: { contains: string; mode: "insensitive" } } | { email: { contains: string; mode: "insensitive" } }>;
    } = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch total
    const total = await db.client.count({ where });

    // Fetch paginated results
    const clients = await db.client.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { projects: true, invoices: true },
        },
      },
    });

    // Enrich with metadata
    const items: ClientWithMetadata[] = await Promise.all(
      clients.map(async (client) => {
        const invoices = await db.invoice.findMany({ where: { clientId: client.id } });
        const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const meetings = await db.meeting.findMany({
          where: { clientId: client.id },
          orderBy: { startsAt: "desc" },
          take: 1,
        });

        return {
          id: client.id,
          name: client.name,
          email: client.email || "",
          phone: client.phone || undefined,
          status: client.status as "active" | "inactive" | "prospect",
          industry: client.industry || undefined,
          website: client.website || undefined,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          projectCount: client._count.projects,
          invoiceCount: client._count.invoices,
          totalSpent,
          lastInteractionDate: meetings[0]?.startsAt,
        };
      }),
    );

    return { items, total, page, pageSize };
  } catch (error) {
    console.error("Failed to list clients:", error);
    throw error;
  }
}

export async function getClientById(id: string): Promise<ClientProfile | null> {
  try {
    const client = await db.client.findUnique({ where: { id } });
    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      email: client.email || "",
      phone: client.phone || undefined,
      status: client.status as "active" | "inactive" | "prospect",
      industry: client.industry || undefined,
      website: client.website || undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  } catch (error) {
    console.error("Failed to get client:", error);
    throw error;
  }
}

export async function createClient(input: CreateClientInput): Promise<ClientProfile> {
  try {
    const client = await db.client.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        status: input.status,
        industry: input.industry,
        website: input.website,
      },
    });

    await logActivity({
      eventType: "client_created",
      entityType: "client",
      entityId: client.id,
      title: `Client created: ${client.name}`,
      description: `${client.name} was added to CRM lifecycle`,
      clientId: client.id,
      actorName: "System",
    });

    await createNotification({
      title: "New client onboarded",
      message: `${client.name} is ready for notes, files, meetings, and projects.`,
      type: "success",
      entityType: "client",
      entityId: client.id,
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email || "",
      phone: client.phone || undefined,
      status: client.status as "active" | "inactive" | "prospect",
      industry: client.industry || undefined,
      website: client.website || undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  } catch (error) {
    console.error("Failed to create client:", error);
    throw error;
  }
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<ClientProfile> {
  try {
    const client = await db.client.update({
      where: { id },
      data: input,
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email || "",
      phone: client.phone || undefined,
      status: client.status as "active" | "inactive" | "prospect",
      industry: client.industry || undefined,
      website: client.website || undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  } catch (error) {
    console.error("Failed to update client:", error);
    throw error;
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await db.client.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete client:", error);
    throw error;
  }
}

export async function getClientNotes(clientId: string): Promise<ClientNote[]> {
  try {
    const notes = await db.clientNote.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    return notes.map((note) => ({
      id: note.id,
      clientId,
      content: note.content,
      createdBy: note.createdByName || "System",
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  } catch (error) {
    console.error("Failed to get client notes:", error);
    throw error;
  }
}

export async function getClientMeetings(clientId: string): Promise<ClientMeeting[]> {
  try {
    const meetings = await db.meeting.findMany({
      where: { clientId },
      include: {
        attendees: {
          select: { userId: true },
        },
      },
      orderBy: { startsAt: "desc" },
    });

    return meetings.map((m) => ({
      id: m.id,
      clientId,
      title: m.title,
      startsAt: m.startsAt,
      duration: m.duration,
      room: m.room || undefined,
      attendees: m.attendees.map((a) => a.userId),
    }));
  } catch (error) {
    console.error("Failed to get client meetings:", error);
    throw error;
  }
}

export async function getClientInvoices(clientId: string) {
  try {
    return await db.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to get client invoices:", error);
    throw error;
  }
}

export async function getClientProjects(clientId: string) {
  try {
    return await db.project.findMany({
      where: { clientId },
      include: {
        members: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to get client projects:", error);
    throw error;
  }
}

export async function addClientNote(input: CreateClientNoteInput): Promise<ClientNote> {
  const note = await db.clientNote.create({
    data: {
      clientId: input.clientId,
      content: input.content,
      createdByName: "Team",
    },
  });

  await logActivity({
    eventType: "note_added",
    entityType: "client",
    entityId: input.clientId,
    title: "Client note added",
    description: input.content.slice(0, 120),
    clientId: input.clientId,
    actorName: "Team",
  });

  return {
    id: note.id,
    clientId: note.clientId,
    content: note.content,
    createdBy: note.createdByName || "Team",
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function uploadClientFile(input: UploadClientFileInput): Promise<ClientFile> {
  const attachment = await db.attachment.create({
    data: {
      ownerType: "client",
      clientId: input.clientId,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url || `/uploads/clients/${input.clientId}/${Date.now()}-${input.name}`,
    },
  });

  await logActivity({
    eventType: "file_uploaded",
    entityType: "file",
    entityId: attachment.id,
    title: "Client file uploaded",
    description: `${attachment.name} attached to client`,
    clientId: input.clientId,
    actorName: "Team",
  });

  return {
    id: attachment.id,
    clientId: input.clientId,
    name: attachment.name,
    url: attachment.url,
    mimeType: attachment.mimeType,
    size: attachment.size,
    uploadedBy: "Team",
    uploadedAt: attachment.createdAt,
  };
}

export async function listClientFiles(clientId: string): Promise<ClientFile[]> {
  const files = await db.attachment.findMany({
    where: { clientId, ownerType: "client" },
    orderBy: { createdAt: "desc" },
  });

  return files.map((file) => ({
    id: file.id,
    clientId,
    name: file.name,
    url: file.url,
    mimeType: file.mimeType,
    size: file.size,
    uploadedBy: "Team",
    uploadedAt: file.createdAt,
  }));
}

export async function scheduleClientMeeting(input: ScheduleClientMeetingInput): Promise<ClientMeeting> {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.duration * 60000);

  const meeting = await db.meeting.create({
    data: {
      clientId: input.clientId,
      title: input.title,
      startsAt,
      endsAt,
      duration: input.duration,
      room: input.room,
      attendees: {
        create: (input.attendeeIds || []).map((userId) => ({ userId })),
      },
    },
    include: { attendees: true },
  });

  await logActivity({
    eventType: "meeting_scheduled",
    entityType: "meeting",
    entityId: meeting.id,
    title: "Client meeting scheduled",
    description: `${input.title} on ${startsAt.toLocaleString()}`,
    clientId: input.clientId,
    meetingId: meeting.id,
    actorName: "Team",
  });

  return {
    id: meeting.id,
    clientId: input.clientId,
    title: meeting.title,
    startsAt: meeting.startsAt,
    duration: meeting.duration,
    room: meeting.room || undefined,
    attendees: meeting.attendees.map((a) => a.userId),
  };
}

export async function createClientRelatedProject(clientId: string, name: string) {
  const client = await db.client.findUnique({ where: { id: clientId }, select: { name: true } });

  const project = await db.project.create({
    data: {
      clientId,
      name,
      stage: "discovery",
      status: "planning",
      budget: 0,
      progress: 0,
      spent: 0,
      startDate: new Date(),
    },
  });

  await logActivity({
    eventType: "project_created",
    entityType: "project",
    entityId: project.id,
    title: "Project created from client",
    description: `${project.name} created for ${client?.name || "client"}`,
    clientId,
    projectId: project.id,
    actorName: "Team",
  });

  return project;
}

export async function createClientInvoice(input: CreateClientInvoiceInput) {
  const createdCount = await db.invoice.count();
  const invoice = await db.invoice.create({
    data: {
      number: `INV-${new Date().getFullYear()}-${String(createdCount + 1).padStart(4, "0")}`,
      clientId: input.clientId,
      projectId: input.projectId,
      amount: input.amount,
      status: "sent",
      issuedAt: new Date(),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
  });

  await logActivity({
    eventType: "invoice_created",
    entityType: "invoice",
    entityId: invoice.id,
    title: "Invoice generated",
    description: `${invoice.number} for $${Number(invoice.amount).toLocaleString()}`,
    clientId: input.clientId,
    projectId: input.projectId,
    invoiceId: invoice.id,
    actorName: "Finance",
  });

  await createNotification({
    title: "Invoice generated",
    message: `${invoice.number} is ready and marked as sent.`,
    type: "info",
    entityType: "invoice",
    entityId: invoice.id,
  });

  return invoice;
}

export async function getClientActivityTimeline(clientId: string): Promise<ClientActivityItem[]> {
  const events = await db.activityEvent.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    actor: event.actorName || "System",
    createdAt: event.createdAt,
  }));
}

export async function getClientLifecycleSnapshot(clientId: string): Promise<ClientLifecycleSnapshot | null> {
  const client = await getClientById(clientId);
  if (!client) {
    return null;
  }

  const [notes, files, meetings, projects, invoices, activities] = await Promise.all([
    getClientNotes(clientId),
    listClientFiles(clientId),
    getClientMeetings(clientId),
    getClientProjects(clientId),
    getClientInvoices(clientId),
    getClientActivityTimeline(clientId),
  ]);

  return {
    client,
    notes,
    files,
    meetings,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      stage: project.stage,
      status: project.status,
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: Number(invoice.amount),
      status: invoice.status,
      dueAt: invoice.dueAt || undefined,
    })),
    activities,
  };
}
