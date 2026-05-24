"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <Tabs value={selected} onValueChange={onChange}>
      <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
        <TabsTrigger
          value="all"
          className="rounded-full border border-gray-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
        >
          All
        </TabsTrigger>
        {categories.map((cat) => (
          <TabsTrigger
            key={cat.id}
            value={cat.id}
            className="rounded-full border border-gray-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
          >
            {cat.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
