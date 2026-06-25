import { requireProfile } from "@/lib/dal";
import { EditItemForm } from "@/components/dashboard/EditItemForm";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <EditItemForm itemId={id} plan={profile.plan} />
    </main>
  );
}
