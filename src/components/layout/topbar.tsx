import Link from "next/link";
import { cookies } from "next/headers";

import { auth, signOut } from "@/auth";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { LOCALE_COOKIE, normalizeLocale, t } from "@/lib/i18n";
import { getUnreadNotificationCount } from "@/services/activity.service";

export async function Topbar() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const [session, unreadCount] = await Promise.all([auth(), getUnreadNotificationCount()]);
  const user = session?.user;

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-surface/75 px-4 py-4 backdrop-blur sm:px-6 lg:px-8 xl:px-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            {t(locale, "planDesignPlatform")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {user?.name
              ? t(locale, "welcomeBack", { name: user.name })
              : t(locale, "roleAwareLayout")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher initialLocale={locale} />

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
                {t(locale, "signOut")}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
            >
              {t(locale, "signIn")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link
          href="/dashboard"
          className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white"
        >
          {t(locale, "dashboard")}
        </Link>
        <span className="rounded-full border border-border px-3 py-1.5">
          {t(locale, "unreadNotifications", { count: unreadCount })}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          {t(locale, "commandPalette")}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          {t(locale, "appRouter")}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          {t(locale, "prismaReady")}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5">
          {t(locale, "postgresReady")}
        </span>
      </div>
    </header>
  );
}