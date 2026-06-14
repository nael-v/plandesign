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

/**
 * Returns the active locale and a setter.
 * Uses initialLocale (from the server) as the source of truth after
 * router.refresh() so that client components re-render with the correct
 * language after a locale switch.
 */
export function useLocale(initialLocale: AppLocale = DEFAULT_LOCALE) {
  // Track the last initialLocale we received so we can detect when the server
  // sends a new one (after router.refresh()) and update accordingly.
  const [prevInitial, setPrevInitial] = useState(initialLocale);
  const [locale, setLocale] = useState<AppLocale>(() => {
    if (typeof document !== "undefined") return readLocaleCookie();
    return initialLocale;
  });

  if (prevInitial !== initialLocale) {
    setPrevInitial(initialLocale);
    setLocale(initialLocale);
  }

  return { locale, setLocale };
}
