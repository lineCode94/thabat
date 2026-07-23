import { Skeleton } from "@/components/ui/skeleton";

export function TrackingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        ))}
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
