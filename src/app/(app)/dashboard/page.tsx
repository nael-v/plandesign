import { cookies } from "next/headers";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getDashboardSnapshot } from "@/services/dashboard.service";
import { NotificationsCenter } from "@/components/workflow/notifications-center";
import { MeetingsCalendar } from "@/components/workflow/meetings-calendar";
import { AppLocale, LOCALE_COOKIE, formatDate, localizedValue, normalizeLocale } from "@/lib/i18n";

const PRIORITY_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  review: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
};

function taskStatusLabel(locale: AppLocale, status: string): string {
  const labels: Record<string, { en: string; he: string }> = {
    todo: { en: "To do", he: "לביצוע" },
    in_progress: { en: "In progress", he: "בתהליך" },
    review: { en: "Review", he: "לבדיקה" },
    done: { en: "Done", he: "בוצע" },
  };
  return labels[status]?.[locale] ?? status.replaceAll("_", " ");
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const [session, snapshot] = await Promise.all([auth(), getDashboardSnapshot()]);

  const greeting = session?.user?.name
    ? localizedValue(locale, {
        en: `Good to see you, ${session.user.name.split(" ")[0]}.`,
        he: `נעים לראות אותך, ${session.user.name.split(" ")[0]}.`,
      })
    : localizedValue(locale, { en: "Executive command center", he: "מרכז שליטה ניהולי" });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow={localizedValue(locale, { en: "Dashboard", he: "לוח בקרה" })}
        title={greeting}
        description={localizedValue(locale, { en: "Track delivery, revenue, client health, and operations from a single view.", he: "עקוב אחר מסירה, הכנסות, בריאות לקוחות ותפעול ממסך אחד." })}
        action={<Button variant="secondary">{localizedValue(locale, { en: "Export report", he: "ייצוא דוח" })}</Button>}
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
        <NotificationsCenter initialLocale={locale} />
        <MeetingsCalendar initialLocale={locale} />
      </section>

      {/* Meetings + Tasks */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{localizedValue(locale, { en: "Upcoming meetings", he: "פגישות קרובות" })}</CardTitle>
            <CardDescription>{localizedValue(locale, { en: "Next scheduled client and project sessions.", he: "פגישות הלקוח והפרויקט המתוכננות הבאות." })}</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.meetings.length === 0 ? (
              <p className="text-sm text-muted">{localizedValue(locale, { en: "No upcoming meetings scheduled.", he: "אין כרגע פגישות קרובות מתוזמנות." })}</p>
            ) : (
              <ul className="grid gap-3">
                {snapshot.meetings.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-1 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">{m.clientName}</span>
                    <span className="text-xs text-muted">{formatDate(locale, m.startsAt, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
            <CardTitle>{localizedValue(locale, { en: "Open tasks", he: "משימות פתוחות" })}</CardTitle>
            <CardDescription>{localizedValue(locale, { en: "Active items requiring team attention.", he: "פריטים פעילים שדורשים תשומת לב של הצוות." })}</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.tasks.length === 0 ? (
              <p className="text-sm text-muted">{localizedValue(locale, { en: "No open tasks.", he: "אין משימות פתוחות." })}</p>
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
                      {taskStatusLabel(locale, t.status)}
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
            <CardTitle>{localizedValue(locale, { en: "Recent clients", he: "לקוחות אחרונים" })}</CardTitle>
            <CardDescription>{localizedValue(locale, { en: "Latest relationships added to the CRM.", he: "הקשרים האחרונים שנוספו ל-CRM." })}</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.recentClients.length === 0 ? (
              <p className="text-sm text-muted">{localizedValue(locale, { en: "No clients yet.", he: "עדיין אין לקוחות." })}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {snapshot.recentClients.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {localizedValue(locale, {
                        en: `${c.projectCount} project${c.projectCount !== 1 ? "s" : ""}`,
                        he: `${c.projectCount} פרויקטים`,
                      })}
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
