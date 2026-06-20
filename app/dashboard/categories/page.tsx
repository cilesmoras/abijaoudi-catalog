import { requireProfile } from "@/lib/dal";
import { CategoriesManager } from "@/components/dashboard/CategoriesManager";

export default async function DashboardCategoriesPage() {
  await requireProfile();
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <CategoriesManager />
    </main>
  );
}
