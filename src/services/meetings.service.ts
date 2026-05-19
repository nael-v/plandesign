"use server";

import { db } from "@/lib/db";
import { createNotification, logActivity } from "@/services/activity.service";

type ScheduleMeetingInput = {
  title: string;
  startsAt: string;
  duration: number;
  room?: string;
  notes?: string;
  clientId?: string;
  projectId?: string;
  attendeeIds?: string[];
};

export async function scheduleMeeting(input: ScheduleMeetingInput) {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.duration * 60000);

  const meeting = await db.meeting.create({
    data: {
      title: input.title,
      startsAt,
      endsAt,
      duration: input.duration,
      room: input.room,
      notes: input.notes,
      clientId: input.clientId,
      projectId: input.projectId,
      attendees: {
        create: (input.attendeeIds || []).map((userId) => ({ userId })),
      },
    },
  });

  await logActivity({
    eventType: "meeting_scheduled",
    entityType: "meeting",
    entityId: meeting.id,
    title: "Meeting scheduled",
    description: `${meeting.title} at ${startsAt.toLocaleString()}`,
    meetingId: meeting.id,
    clientId: input.clientId,
    projectId: input.projectId,
    actorName: "Coordinator",
  });

  await createNotification({
    title: "Upcoming meeting",
    message: `${meeting.title} has been added to the calendar.`,
    type: "info",
    entityType: "meeting",
    entityId: meeting.id,
  });

  return meeting;
}

export async function listCalendarMeetings() {
  return db.meeting.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
      attendees: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function listUpcomingMeetings(limit = 8) {
  return db.meeting.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function listMeetingReminders(hoursAhead = 48) {
  const now = new Date();
  const horizon = new Date(now.getTime() + hoursAhead * 3600 * 1000);

  return db.meeting.findMany({
    where: {
      startsAt: {
        gte: now,
        lte: horizon,
      },
    },
    orderBy: { startsAt: "asc" },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
}
