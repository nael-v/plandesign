import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";
import { ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface/90 p-8 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-surface-elevated px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-muted">
              Enterprise SaaS foundation
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                PlanDesign is built for architectural operations at studio scale.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Modular Next.js architecture, role-aware product boundaries, and clean service layers for
                CRM, projects, finances, suppliers, and future AI planning tools.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Open dashboard
              </Link>
              <Link
                href="#architecture"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
              >
                View architecture
              </Link>
            </div>
          </div>

          <Card className="border-border bg-surface-elevated/80">
            <CardHeader>
              <CardTitle>Role model</CardTitle>
              <CardDescription>Designed to scale from solo freelancers to multi-team studios.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted sm:grid-cols-2">
              {USER_ROLES.map((role) => (
                <div key={role} className="rounded-2xl border border-border bg-background/60 px-4 py-3">
                  <div className="font-medium text-foreground">{ROLE_LABELS[role]}</div>
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
              <CardTitle>{item.label}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm text-muted">
              <span>{item.module}</span>
              <Link className="font-medium text-foreground hover:underline" href={item.href}>
                Open module
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-foreground">Studio onboarding flow</h2>
          <p className="mt-1 text-sm text-muted">
            Follow this checklist to simulate a realistic first week with PlanDesign.
          </p>
        </div>

        <ol className="grid gap-3 md:grid-cols-2">
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">1. Create your first client</p>
            <p className="mt-1 text-muted">Open CRM and add a client profile with contact details and status.</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">2. Add notes and files</p>
            <p className="mt-1 text-muted">Capture discovery notes and upload brand guides, plans, and PDFs.</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">3. Kick off project workflow</p>
            <p className="mt-1 text-muted">Create a project, assign members, add tasks, and move items through Kanban.</p>
          </li>
          <li className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium text-foreground">4. Run financial operations</p>
            <p className="mt-1 text-muted">Generate invoices, mark paid, log expenses, and track margin trends.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
