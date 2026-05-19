import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getDashboardSnapshot } from "@/services/dashboard.service";
import { NotificationsCenter } from "@/components/workflow/notifications-center";
import { MeetingsCalendar } from "@/components/workflow/meetings-calendar";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PRIORITY_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  review: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
};

export default async function DashboardPage() {
  const [session, snapshot] = await Promise.all([auth(), getDashboardSnapshot()]);

  const greeting = session?.user?.name
    ? `Good to see you, ${session.user.name.split(" ")[0]}.`
    : "Executive command center";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Dashboard"
        title={greeting}
        description="Track delivery, revenue, client health, and operations from a single view."
        action={<Button variant="secondary">Export report</Button>}
      />

      {/* KPI strip */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((m) => (
          <StatCard key={m.label} title={m.label} value={m.value} description={m.trend} />
        ))}
      </section>

      {/* Notifications */}
      {snapshot.notifications.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4">
          {snapshot.notifications.map((n) => (
            <p key={n} className="text-sm text-amber-800">
              {n}
            </p>
          ))}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <NotificationsCenter />
        <MeetingsCalendar />
      </section>

      {/* Meetings + Tasks */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
            <CardDescription>Next scheduled client and project sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.meetings.length === 0 ? (
              <p className="text-sm text-muted">No upcoming meetings scheduled.</p>
            ) : (
              <ul className="grid gap-3">
                {snapshot.meetings.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-1 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">{m.clientName}</span>
                    <span className="text-xs text-muted">{formatDate(m.startsAt)}</span>
                    {m.room !== "TBD" && (
                      <span className="text-xs text-muted">{m.room}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open tasks</CardTitle>
            <CardDescription>Active items requiring team attention.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.tasks.length === 0 ? (
              <p className="text-sm text-muted">No open tasks.</p>
            ) : (
              <ul className="grid gap-3">
                {snapshot.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{t.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{t.assignee}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[t.status] ?? PRIORITY_BADGE.todo}`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent clients */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent clients</CardTitle>
            <CardDescription>Latest relationships added to the CRM.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.recentClients.length === 0 ? (
              <p className="text-sm text-muted">No clients yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {snapshot.recentClients.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {c.projectCount} project{c.projectCount !== 1 ? "s" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
