"use server";

import type { ActivityEntityType, ActivityEventType, NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";

type LogActivityInput = {
  eventType: ActivityEventType;
  entityType: ActivityEntityType;
  entityId: string;
  title: string;
  description: string;
  actorId?: string;
  actorName?: string;
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  taskId?: string;
  meetingId?: string;
  metadata?: Record<string, unknown>;
};

type CreateNotificationInput = {
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  entityType?: ActivityEntityType;
  entityId?: string;
};

export async function logActivity(input: LogActivityInput) {
  return db.activityEvent.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      description: input.description,
      actorId: input.actorId,
      actorName: input.actorName,
      clientId: input.clientId,
      projectId: input.projectId,
      invoiceId: input.invoiceId,
      taskId: input.taskId,
      meetingId: input.meetingId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}

export async function listNotifications(limit = 30) {
  return db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  return db.notification.count({ where: { isRead: false } });
}

export async function markNotificationRead(id: string) {
  return db.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}
