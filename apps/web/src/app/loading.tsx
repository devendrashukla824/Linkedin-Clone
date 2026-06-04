import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container grid min-h-screen gap-4 py-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Skeleton className="hidden h-80 md:block" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="hidden h-80 xl:block" />
      </div>
    </main>
  );
}
