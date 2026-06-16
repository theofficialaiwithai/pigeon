import { Skeleton } from "@/components/ui/skeleton";

export default function SequenceLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-9 w-96" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
