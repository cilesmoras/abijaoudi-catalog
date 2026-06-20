import { requireProfile } from "@/lib/dal";
import { NewItemForm } from "@/components/dashboard/NewItemForm";

export default async function NewItemPage() {
  await requireProfile();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <NewItemForm />
    </main>
  );
}
