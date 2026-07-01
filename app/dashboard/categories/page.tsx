import { CategoriesManager } from "@/components/dashboard/CategoriesManager";
import { requireProfile } from "@/lib/dal";

export const metadata = { title: "Categories | Cataloo" };

export default async function DashboardCategoriesPage() {
  await requireProfile();
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <CategoriesManager />
    </main>
  );
}
