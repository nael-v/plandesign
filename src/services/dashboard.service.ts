import { db } from "@/lib/server/db";
import type { DashboardSnapshot } from "@/features/dashboard";

const STUBS: DashboardSnapshot = {
  metrics: [
    { label: "Active projects", value: "–", trend: "Connect DATABASE_URL" },
    { label: "Monthly revenue", value: "–", trend: "Connect DATABASE_URL" },
    { label: "Open tasks", value: "–", trend: "Connect DATABASE_URL" },
    { label: "Upcoming meetings", value: "–", trend: "Connect DATABASE_URL" },
  ],
  meetings: [],
  tasks: [],
  revenue: "–",
  recentClients: [],
  notifications: [
    "DATABASE_URL is not configured. Copy .env.local.example to .env.local and fill in your PostgreSQL credentials.",
  ],
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const now = new Date();

    const [
      activeProjectCount,
      openTaskCount,
      upcomingMeetingCount,
      paidThisMonth,
      upcomingMeetings,
      recentClients,
      openTasks,
    ] = await Promise.all([
      db.project.count({ where: { status: "active" } }),

      db.task.count({
        where: { status: { in: ["todo", "in_progress", "review"] } },
      }),

      db.meeting.count({
        where: { startsAt: { gte: now } },
      }),

      db.invoice.aggregate({
        where: {
          status: "paid",
          issuedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),

      db.meeting.findMany({
        where: { startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 5,
        include: { client: { select: { name: true } } },
      }),

      db.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { projects: true } } },
      }),

      db.task.findMany({
        where: { status: { in: ["todo", "in_progress", "review"] } },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: 8,
        include: {
          assignee: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
    ]);

    const revenue = paidThisMonth._sum.amount
      ? `$${Number(paidThisMonth._sum.amount).toLocaleString()}`
      : "$0";

    return {
      metrics: [
        {
          label: "Active projects",
          value: String(activeProjectCount),
          trend: "All statuses tracked",
        },
        {
          label: "Monthly revenue",
          value: revenue,
          trend: "Paid invoices this month",
        },
        {
          label: "Open tasks",
          value: String(openTaskCount),
          trend: "Todo + In-progress + Review",
        },
        {
          label: "Upcoming meetings",
          value: String(upcomingMeetingCount),
          trend: "Scheduled from today",
        },
      ],

      meetings: upcomingMeetings.map((m) => ({
        id: m.id,
        clientName: m.client?.name ?? "Internal",
        startsAt: m.startsAt.toISOString(),
        room: m.location ?? "TBD",
      })),

      tasks: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        assignee: t.assignee?.name ?? "Unassigned",
        status: t.status as "pending" | "in-progress" | "done",
      })),

      revenue,

      recentClients: recentClients.map((c) => ({
        id: c.id,
        name: c.name,
        projectCount: c._count.projects,
      })),

      notifications: [],
    };
  } catch {
    return STUBS;
  }
}
