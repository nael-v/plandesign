export type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
};

export type UpcomingMeeting = {
  id: string;
  clientName: string;
  startsAt: string;
  room: string;
};

export type DashboardSnapshot = {
  metrics: DashboardMetric[];
  meetings: UpcomingMeeting[];
  tasks: Array<{ id: string; title: string; assignee: string; status: "pending" | "in-progress" | "done" }>;
  revenue: string;
  recentClients: Array<{ id: string; name: string; projectCount: number }>;
  notifications: string[];
};