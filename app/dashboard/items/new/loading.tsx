import { ItemFormSkeleton } from "@/components/dashboard/ItemFormSkeleton";

export default function NewItemLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ItemFormSkeleton />
    </main>
  );
}
