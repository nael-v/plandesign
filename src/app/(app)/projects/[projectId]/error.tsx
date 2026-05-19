"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-100 bg-red-50/50 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted">
            {error.message || "Failed to load the project workspace."}
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-muted opacity-60">Error ID: {error.digest}</p>
          )}
        </div>
        <Button onClick={reset} variant="ghost" size="sm">
          Try again
        </Button>
      </div>
    </main>
  );
}
