import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback for the settings page. Mirrors the header + the stacked
 * label/field rows of the ProfileForm rendered by SettingsForm.
 */
export function SettingsSkeleton() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="space-y-5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    </>
  );
}
