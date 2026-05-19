import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  roadmap: string[];
  action?: ReactNode;
};

export function ModulePage({ eyebrow, title, description, highlights, roadmap, action }: ModulePageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">{eyebrow}</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Key focus areas</CardTitle>
            <CardDescription>What this module should own in a production SaaS architecture.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm leading-6 text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended roadmap</CardTitle>
            <CardDescription>How to evolve the module without collapsing the architecture.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3">
              {roadmap.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm leading-6 text-foreground"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}