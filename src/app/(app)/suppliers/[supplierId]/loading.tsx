import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierWorkspaceLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </main>
  );
}
