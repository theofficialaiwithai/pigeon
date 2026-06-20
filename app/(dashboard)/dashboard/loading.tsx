import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-pigeon-border bg-white p-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-9 w-28 rounded-lg mt-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
