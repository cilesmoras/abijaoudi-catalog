import { Skeleton } from "@/components/ui/skeleton";

export default function PasswordLoading() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-36" />
      </div>
    </main>
  );
}
