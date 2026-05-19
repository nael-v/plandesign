"use client";

import { Bell, BellRing, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markNotificationReadAction } from "@/actions/workflows";
import { getUnreadNotificationCount, listNotifications } from "@/services/activity.service";
import { Button } from "@/components/ui/button";

function badgeClass(type: string) {
  if (type === "success") return "bg-emerald-50 text-emerald-700";
  if (type === "warning") return "bg-amber-50 text-amber-700";
  if (type === "error") return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
}

export function NotificationsCenter() {
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications(25),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationReadAction({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <section className="rounded-3xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Number(unreadQuery.data || 0) > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600" />
          ) : (
            <Bell className="h-5 w-5 text-muted" />
          )}
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          {unreadQuery.data || 0} unread
        </span>
      </div>

      <ul className="space-y-2">
        {notificationsQuery.data?.length ? (
          notificationsQuery.data.map((notification) => (
            <li
              key={notification.id}
              className="rounded-2xl border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${badgeClass(notification.type)}`}>
                    {notification.type}
                  </span>
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
            No notifications yet. Workflow events will appear here.
          </li>
        )}
      </ul>
    </section>
  );
}
