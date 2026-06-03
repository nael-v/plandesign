"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLocale, t } from "@/lib/i18n";

type LanguageSwitcherProps = {
  initialLocale: AppLocale;
};

export function LanguageSwitcher({ initialLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<AppLocale>(initialLocale);
  const [pending, setPending] = useState(false);

  async function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale || pending) return;
    setPending(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      setLocale(nextLocale);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 p-1">
      <button
        type="button"
        onClick={() => changeLocale("en")}
        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
          locale === "en" ? "bg-slate-900 text-white" : "text-muted hover:bg-slate-100"
        }`}
        aria-label={t(locale, "english")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => changeLocale("he")}
        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
          locale === "he" ? "bg-slate-900 text-white" : "text-muted hover:bg-slate-100"
        }`}
        aria-label={t(locale, "hebrew")}
      >
        עב
      </button>
    </div>
  );
}
