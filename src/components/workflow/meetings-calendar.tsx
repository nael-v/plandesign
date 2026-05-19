"use client";

import { CalendarClock, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduleMeetingAction } from "@/actions/workflows";
import { listMeetingReminders, listUpcomingMeetings } from "@/services/meetings.service";
import { Button } from "@/components/ui/button";

type MeetingsCalendarProps = {
  clientId?: string;
  projectId?: string;
};

export function MeetingsCalendar({ clientId, projectId }: MeetingsCalendarProps) {
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
          <h3 className="text-sm font-semibold text-foreground">Meetings Calendar</h3>
        </div>
        <Button size="sm" type="button" onClick={() => scheduleMutation.mutate()}>
          <Plus className="h-4 w-4" />
          Quick schedule
        </Button>
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-800">
          {remindersQuery.data?.length || 0} meetings within the next 72 hours
        </p>
      </div>

      <ul className="space-y-2">
        {upcomingQuery.data?.length ? (
          upcomingQuery.data.map((meeting) => (
            <li key={meeting.id} className="rounded-2xl border border-border bg-surface p-3">
              <p className="text-sm font-medium text-foreground">{meeting.title}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(meeting.startsAt).toLocaleString()} • {meeting.duration} mins
              </p>
              <p className="mt-1 text-xs text-muted">
                {meeting.client?.name || "Internal"} • {meeting.project?.name || "General"}
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
            No upcoming meetings. Schedule your first review.
          </li>
        )}
      </ul>
    </section>
  );
}
