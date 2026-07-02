import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/dal";
import { getCategoriesForOwner, getItemForOwner } from "@/lib/queries";
import { EditItemForm } from "@/components/dashboard/EditItemForm";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const [item, categories] = await Promise.all([
    getItemForOwner(profile.id, id),
    getCategoriesForOwner(profile.id),
  ]);

  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <EditItemForm item={item} categories={categories} plan={profile.plan} />
    </main>
  );
}
