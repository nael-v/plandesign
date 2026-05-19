import { Skeleton } from "@/components/ui/skeleton";

export default function CrmLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
