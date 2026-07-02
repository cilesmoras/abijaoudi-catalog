import { ItemsSkeleton } from "@/components/dashboard/ItemsSkeleton";

export default function ItemsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <ItemsSkeleton />
    </main>
  );
}
