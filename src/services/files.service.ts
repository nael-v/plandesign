"use server";

import { db } from "@/lib/server/db";
import { logActivity } from "@/services/activity.service";

type UploadAttachmentInput = {
  ownerType: "client" | "project";
  ownerId: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
};

function buildFallbackUrl(input: UploadAttachmentInput) {
  const scope = input.ownerType === "client" ? "clients" : "projects";
  return `/uploads/${scope}/${input.ownerId}/${Date.now()}-${encodeURIComponent(input.name)}`;
}

export async function uploadAttachment(input: UploadAttachmentInput) {
  const record = await db.attachment.create({
    data: {
      ownerType: input.ownerType,
      clientId: input.ownerType === "client" ? input.ownerId : null,
      projectId: input.ownerType === "project" ? input.ownerId : null,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url || buildFallbackUrl(input),
    },
  });

  await logActivity({
    eventType: "file_uploaded",
    entityType: "file",
    entityId: record.id,
    title: "Attachment uploaded",
    description: `${record.name} (${record.mimeType})`,
    clientId: record.clientId || undefined,
    projectId: record.projectId || undefined,
    actorName: "Team",
  });

  return record;
}

export async function listAttachmentsForClient(clientId: string) {
  return db.attachment.findMany({
    where: { ownerType: "client", clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAttachmentsForProject(projectId: string) {
  return db.attachment.findMany({
    where: { ownerType: "project", projectId },
    orderBy: { createdAt: "desc" },
  });
}
