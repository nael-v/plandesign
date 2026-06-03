import { cookies } from "next/headers";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";
import { ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";
import { LOCALE_COOKIE, normalizeLocale, localizedValue } from "@/lib/i18n";

const HOME_NAV_COPY: Record<string, { label: { en: string; he: string }; module: { en: string; he: string }; description: { en: string; he: string } }> = {
  "/dashboard": {
    label: { en: "Dashboard", he: "לוח בקרה" },
    module: { en: "Operations", he: "תפעול" },
    description: { en: "Executive overview of projects, tasks, clients, revenue, and activity.", he: "מבט ניהולי על פרויקטים, משימות, לקוחות, הכנסות ופעילות." },
  },
  "/crm": {
    label: { en: "CRM Clients", he: "לקוחות CRM" },
    module: { en: "Client management", he: "ניהול לקוחות" },
    description: { en: "Profiles, project history, contracts, notes, invoices, and documents.", he: "פרופילים, היסטוריית פרויקטים, חוזים, הערות, חשבוניות ומסמכים." },
  },
  "/projects": {
    label: { en: "Projects", he: "פרויקטים" },
    module: { en: "Delivery", he: "מסירה" },
    description: { en: "Stages, timelines, budgets, team members, files, and version history.", he: "שלבים, לוחות זמנים, תקציבים, אנשי צוות, קבצים והיסטוריית גרסאות." },
  },
  "/finances": {
    label: { en: "Finances", he: "פיננסים" },
    module: { en: "Finance", he: "כספים" },
    description: { en: "Income, expenses, invoices, supplier payments, and profitability.", he: "הכנסות, הוצאות, חשבוניות, תשלומי ספקים ורווחיות." },
  },
  "/suppliers": {
    label: { en: "Suppliers", he: "ספקים" },
    module: { en: "Procurement", he: "רכש" },
    description: { en: "Vendors, pricing, orders, contacts, and purchase notes.", he: "ספקים, תמחור, הזמנות, אנשי קשר והערות רכש." },
  },
  "/ai": {
    label: { en: "AI tools", he: "כלי AI" },
    module: { en: "Future ready", he: "מוכן לעתיד" },
    description: { en: "A ready path for AI-assisted layouts, recommendations, and planning.", he: "תשתית מוכנה לפריסות, המלצות ותכנון בעזרת AI." },
  },
};

const ROLE_COPY: Record<string, { en: string; he: string }> = {
  admin: { en: "Admin", he: "מנהל" },
  architect: { en: "Architect", he: "אדריכל" },
  interior_designer: { en: "Interior Designer", he: "מעצב פנים" },
  employee: { en: "Employee", he: "עובד" },
  client: { en: "Client", he: "לקוח" },
};

export default async function Home() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface/90 p-8 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-surface-elevated px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-muted">
              {localizedValue(locale, { en: "Enterprise SaaS foundation", he: "תשתית SaaS ארגונית" })}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {localizedValue(locale, {
                  en: "PlanDesign is built for architectural operations at studio scale.",
                  he: "PlanDesign נבנתה לניהול פעילות אדריכלית בקנה מידה של סטודיו.",
                })}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                {localizedValue(locale, {
                  en: "Modular Next.js architecture, role-aware product boundaries, and clean service layers for CRM, projects, finances, suppliers, and future AI planning tools.",
                  he: "ארכיטקטורת Next.js מודולרית, גבולות מוצר מותאמי תפקיד ושכבות שירות נקיות עבור CRM, פרויקטים, פיננסים, ספקים וכלי AI עתידיים.",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {localizedValue(locale, { en: "Open dashboard", he: "פתח לוח בקרה" })}
              </Link>
              <Link
                href="#architecture"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
              >
                {localizedValue(locale, { en: "View architecture", he: "הצג ארכיטקטורה" })}
              </Link>
            </div>
          </div>

          <Card className="border-border bg-surface-elevated/80">
            <CardHeader>
              <CardTitle>{localizedValue(locale, { en: "Role model", he: "מודל תפקידים" })}</CardTitle>
              <CardDescription>
                {localizedValue(locale, {
                  en: "Designed to scale from solo freelancers to multi-team studios.",
                  he: "מתוכננת לצמוח מפרילנסר יחיד ועד לסטודיו מרובה צוותים.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted sm:grid-cols-2">
              {USER_ROLES.map((role) => (
                <div key={role} className="rounded-2xl border border-border bg-background/60 px-4 py-3">
                  <div className="font-medium text-foreground">{ROLE_COPY[role]?.[locale] ?? ROLE_LABELS[role]}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em]">{role.replaceAll("_", " ")}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="architecture" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MAIN_NAVIGATION.map((item) => (
          <Card key={item.href} className="border-border bg-surface/85 transition-transform duration-200 hover:-translate-y-1">
            <CardHeader>
              <CardTitle>{HOME_NAV_COPY[item.href]?.label[locale] ?? item.label}</CardTitle>
              <CardDescription>{HOME_NAV_COPY[item.href]?.description[locale] ?? item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm text-muted">
              <span>{HOME_NAV_COPY[item.href]?.module[locale] ?? item.module}</span>
              <Link className="font-medium text-foreground hover:underline" href={item.href}>
                {localizedValue(locale, { en: "Open module", he: "פתח מודול" })}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-foreground">{localizedValue(locale, { en: "Studio onboarding flow", he: "זרימת קליטה לסטודיו" })}</h2>
          <p className="mt-1 text-sm text-muted">
            {localizedValue(locale, {
              en: "Follow this checklist to simulate a realistic first week with PlanDesign.",
              he: "השתמש ברשימה הזו כדי לדמות שבוע ראשון מציאותי עם PlanDesign.",
            })}
          </p>
        </div>

        <ol className="grid gap-3 md:grid-cols-2">
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">{localizedValue(locale, { en: "1. Create your first client", he: "1. צור את הלקוח הראשון שלך" })}</p>
            <p className="mt-1 text-muted">{localizedValue(locale, { en: "Open CRM and add a client profile with contact details and status.", he: "פתח את ה-CRM והוסף פרופיל לקוח עם פרטי קשר וסטטוס." })}</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">{localizedValue(locale, { en: "2. Add notes and files", he: "2. הוסף הערות וקבצים" })}</p>
            <p className="mt-1 text-muted">{localizedValue(locale, { en: "Capture discovery notes and upload brand guides, plans, and PDFs.", he: "תעד הערות גילוי והעלה קווי מותג, תוכניות וקבצי PDF." })}</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">{localizedValue(locale, { en: "3. Kick off project workflow", he: "3. התחל זרימת עבודה לפרויקט" })}</p>
            <p className="mt-1 text-muted">{localizedValue(locale, { en: "Create a project, assign members, add tasks, and move items through Kanban.", he: "צור פרויקט, הקצה חברי צוות, הוסף משימות והעבר פריטים דרך קנבן." })}</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">{localizedValue(locale, { en: "4. Run financial operations", he: "4. הפעל תהליכי כספים" })}</p>
            <p className="mt-1 text-muted">{localizedValue(locale, { en: "Generate invoices, mark paid, log expenses, and track margin trends.", he: "הפק חשבוניות, סמן כתשלום, רשום הוצאות ונהל מגמות רווחיות." })}</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
