import { CategoriesSkeleton } from "@/components/dashboard/CategoriesSkeleton";

export default function CategoriesLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Categories
          </h1>
          <p className="text-gray-600">Create and remove item categories.</p>
        </div>
      </div>

      <CategoriesSkeleton />
    </main>
  );
}
