import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="bg-white dark:bg-slate-900 border p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-8 mb-6">
        <Skeleton className="h-36 w-36 rounded-full" />
        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border p-6 rounded-lg shadow-sm">
            <Skeleton className="h-7 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 border p-6 rounded-lg shadow-sm h-48">
            <Skeleton className="h-7 w-40 mb-4" />
            <Skeleton className="h-24 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
