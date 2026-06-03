"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";
import { AppLocale, t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

type SidebarProps = {
  initialLocale: AppLocale;
};

const NAV_TRANSLATIONS: Record<
  string,
  {
    label: { en: string; he: string };
    module: { en: string; he: string };
  }
> = {
  "/dashboard": {
    label: { en: "Dashboard", he: "לוח בקרה" },
    module: { en: "Operations", he: "תפעול" },
  },
  "/crm": {
    label: { en: "CRM Clients", he: "לקוחות CRM" },
    module: { en: "Client management", he: "ניהול לקוחות" },
  },
  "/projects": {
    label: { en: "Projects", he: "פרויקטים" },
    module: { en: "Delivery", he: "מסירה" },
  },
  "/finances": {
    label: { en: "Finances", he: "פיננסים" },
    module: { en: "Finance", he: "כספים" },
  },
  "/suppliers": {
    label: { en: "Suppliers", he: "ספקים" },
    module: { en: "Procurement", he: "רכש" },
  },
  "/ai": {
    label: { en: "AI tools", he: "כלי AI" },
    module: { en: "Future ready", he: "מוכן לעתיד" },
  },
};

export function Sidebar({ initialLocale }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { locale } = useLocale(initialLocale);

  return (
    <motion.aside
      initial={{ width: isCollapsed ? "5rem" : "18rem" }}
      animate={{ width: isCollapsed ? "5rem" : "18rem" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden xl:flex fixed left-0 top-0 h-full flex-col border-r border-border bg-surface overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-border shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold text-sm shrink-0">
                PD
              </div>
              <span className="text-sm font-semibold text-foreground truncate">PlanDesign</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 hover:bg-surface-elevated transition-colors duration-200 shrink-0 ml-2"
          title={isCollapsed ? t(locale, "expand") : t(locale, "collapse")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted" />
          )}
        </button>
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 text-xs text-muted border-b border-border"
          >
            {t(locale, "enterpriseArchitecture")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {MAIN_NAVIGATION.map((item) => {
          const translated = NAV_TRANSLATIONS[item.href];
          const label = translated ? translated.label[locale] : item.label;
          const moduleLabel = translated ? translated.module[locale] : item.module;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                "hover:bg-surface-elevated",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              title={label}
            >
              {/* Icon */}
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-surface-elevated group-hover:bg-slate-200 transition-colors duration-200 text-foreground font-medium shrink-0">
                {label.charAt(0).toUpperCase()}
              </div>

              {/* Label and Description */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-0"
                  >
                    <div className="text-sm font-medium text-foreground truncate">{label}</div>
                    <div className="text-xs text-muted truncate">{moduleLabel}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border px-3 py-4"
          >
            <div className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-xs leading-5 text-muted">
              {t(locale, "sidebarFooter")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCollapsed && (
        <div className="border-t border-border px-3 py-4 text-center text-xs text-muted">v1</div>
      )}
    </motion.aside>
  );
}