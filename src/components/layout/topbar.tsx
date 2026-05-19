import Link from "next/link";

import { auth, signOut } from "@/auth";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getUnreadNotificationCount } from "@/services/activity.service";

export async function Topbar() {
  const [session, unreadCount] = await Promise.all([auth(), getUnreadNotificationCount()]);
  const user = session?.user;

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-surface/75 px-4 py-4 backdrop-blur sm:px-6 lg:px-8 xl:px-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            PlanDesign platform
          </p>
          <p className="mt-1 text-sm text-muted">
            {user?.name
              ? `Welcome back, ${user.name}`
              : "Role-aware SaaS layout for studio operations"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs text-muted md:flex">
              <span className="font-medium text-foreground">{user.name ?? user.email}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          ) : null}

          {user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 md:inline-flex"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link
          href="/dashboard"
          className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white"
        >
          Dashboard
        </Link>
        <span className="rounded-full border border-border px-3 py-1.5">
          {unreadCount} unread notifications
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          Ctrl/Cmd + K command palette
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          App Router
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          Prisma ready
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          PostgreSQL ready
        </span>
      </div>
    </header>
  );
}