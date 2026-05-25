"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupplierWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-red-500" />
        <h2 className="mt-3 text-lg font-semibold text-foreground">Could not load supplier workspace</h2>
        <p className="mt-1 text-sm text-muted">{error.message || "Unexpected error"}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="ghost" onClick={reset}>Try again</Button>
          <Link
            href="/suppliers"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            Back to suppliers
          </Link>
        </div>
      </div>
    </main>
  );
}
