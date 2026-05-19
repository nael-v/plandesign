"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type CrmErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CrmError({ error, reset }: CrmErrorProps) {
  useEffect(() => {
    console.error("CRM route error", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="CRM is temporarily unavailable"
        description="We could not load this CRM view. Please retry or refresh."
      />
      <div className="flex justify-center">
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}
