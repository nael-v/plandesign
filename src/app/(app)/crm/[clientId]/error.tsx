"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ClientProfileErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClientProfileError({ error, reset }: ClientProfileErrorProps) {
  useEffect(() => {
    console.error("CRM profile route error", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="Unable to open client profile"
        description="The profile workspace failed to load. Try again to reconnect the lifecycle data."
      />
      <div className="flex justify-center">
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}
