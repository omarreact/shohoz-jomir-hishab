import { Skeleton } from "@/src/shared/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-label="পেজ লোড হচ্ছে">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <div className="grid gap-4 pt-4 md:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
