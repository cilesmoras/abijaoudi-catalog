import { requireProfile } from "@/lib/dal";
import { getCategoriesForOwner } from "@/lib/queries";
import { NewItemForm } from "@/components/dashboard/NewItemForm";

export default async function NewItemPage() {
  const profile = await requireProfile();
  const categories = await getCategoriesForOwner(profile.id);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <NewItemForm plan={profile.plan} categories={categories} />
    </main>
  );
}
