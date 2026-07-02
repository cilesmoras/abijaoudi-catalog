import { Suspense } from "react";
import { CategoriesManager } from "@/components/dashboard/CategoriesManager";
import { CategoriesSkeleton } from "@/components/dashboard/CategoriesSkeleton";
import { requireProfile } from "@/lib/dal";
import { getCategoriesForOwner } from "@/lib/queries";

export const metadata = { title: "Categories | Cataloo" };

export default async function DashboardCategoriesPage() {
  const profile = await requireProfile();

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

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesData ownerId={profile.id} />
      </Suspense>
    </main>
  );
}

async function CategoriesData({ ownerId }: { ownerId: string }) {
  const categories = await getCategoriesForOwner(ownerId);
  return <CategoriesManager initialCategories={categories} />;
}
