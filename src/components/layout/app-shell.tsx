import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "@/components/command-palette";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const isHebrew = locale === "he";

  return (
    <>
      <CommandPalette />
      <div className="min-h-screen flex">
        <Sidebar initialLocale={locale} />
        <div className={`flex min-w-0 flex-1 flex-col ${isHebrew ? "mr-0 xl:mr-[18rem]" : "ml-0 xl:ml-[18rem]"}`}>
          <Topbar />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </>
  );
}