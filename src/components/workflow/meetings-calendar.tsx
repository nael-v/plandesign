"use client";

import { CalendarClock, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduleMeetingAction } from "@/actions/workflows";
import { listMeetingReminders, listUpcomingMeetings } from "@/services/meetings.service";
import { Button } from "@/components/ui/button";
import { AppLocale, formatDateTime, localizedValue } from "@/lib/i18n";

type MeetingsCalendarProps = {
  initialLocale: AppLocale;
  clientId?: string;
  projectId?: string;
};

export function MeetingsCalendar({ initialLocale, clientId, projectId }: MeetingsCalendarProps) {
  const queryClient = useQueryClient();

  const upcomingQuery = useQuery({
    queryKey: ["meetings", "upcoming", clientId || "all", projectId || "all"],
    queryFn: () => listUpcomingMeetings(8),
  });

  const remindersQuery = useQuery({
    queryKey: ["meetings", "reminders"],
    queryFn: () => listMeetingReminders(72),
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      scheduleMeetingAction({
        title: "Quick project sync",
        startsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        duration: 45,
        room: "Studio Room 2",
        clientId,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  return (
    <section className="rounded-3xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-foreground">{localizedValue(initialLocale, { en: "Meetings calendar", he: "יומן פגישות" })}</h3>
        </div>
        <Button size="sm" type="button" onClick={() => scheduleMutation.mutate()}>
          <Plus className="h-4 w-4" />
          {localizedValue(initialLocale, { en: "Quick schedule", he: "תזמון מהיר" })}
        </Button>
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-800">
          {localizedValue(initialLocale, {
            en: `${remindersQuery.data?.length || 0} meetings within the next 72 hours`,
            he: `${remindersQuery.data?.length || 0} פגישות ב-72 השעות הקרובות`,
          })}
        </p>
      </div>

      <ul className="space-y-2">
        {upcomingQuery.data?.length ? (
          upcomingQuery.data.map((meeting) => (
            <li key={meeting.id} className="rounded-2xl border border-border bg-surface p-3">
              <p className="text-sm font-medium text-foreground">{meeting.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDateTime(initialLocale, meeting.startsAt)} • {localizedValue(initialLocale, {
                  en: `${meeting.duration} mins`,
                  he: `${meeting.duration} דק'`,
                })}
              </p>
              <p className="mt-1 text-xs text-muted">
                {meeting.client?.name || localizedValue(initialLocale, { en: "Internal", he: "פנימי" })} • {meeting.project?.name || localizedValue(initialLocale, { en: "General", he: "כללי" })}
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
            {localizedValue(initialLocale, { en: "No upcoming meetings. Schedule your first review.", he: "אין פגישות קרובות. קבע את פגישת הסקירה הראשונה שלך." })}
          </li>
        )}
      </ul>
    </section>
  );
}
