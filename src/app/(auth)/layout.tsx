import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher initialLocale={locale} />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
