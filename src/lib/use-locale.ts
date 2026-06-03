"use client";

import { useState } from "react";
import { AppLocale, DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

function readLocaleCookie(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return normalizeLocale(raw ? decodeURIComponent(raw) : null);
}

export function useLocale(initialLocale: AppLocale = DEFAULT_LOCALE) {
  const [locale, setLocale] = useState<AppLocale>(() => {
    if (typeof document !== "undefined") return readLocaleCookie();
    return initialLocale;
  });

  return { locale, setLocale };
}
