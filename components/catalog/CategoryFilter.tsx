"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onChange: (value: string) => void;
}

// Vertical list shown in the desktop sidebar. Scales to many categories: the
// list simply grows/scrolls instead of wrapping into rows above the grid.
export function CategorySidebar({
  categories,
  selected,
  onChange,
}: CategoryFilterProps) {
  const buttonClass = (value: string) =>
    cn(
      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
      selected === value
        ? "bg-blue-600 font-medium text-white"
        : "text-gray-700 hover:bg-gray-100",
    );

  return (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Categories
      </p>
      <button
        type="button"
        className={buttonClass("all")}
        onClick={() => onChange("all")}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={buttonClass(cat.id)}
          onClick={() => onChange(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}

// Compact dropdown shown on mobile, where a vertical sidebar would waste space.
export function CategorySelect({
  categories,
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
