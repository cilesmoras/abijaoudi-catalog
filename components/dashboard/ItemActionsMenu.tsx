"use client";

import Link from "next/link";
import { EllipsisVertical, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Item } from "@/lib/types";

export function ItemActionsMenu({
  item,
  disabled = false,
  onToggleHidden,
  onRequestDelete,
}: {
  item: Item;
  disabled?: boolean;
  onToggleHidden: (item: Item) => void;
  onRequestDelete: (item: Item) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <EllipsisVertical className="h-4 w-4" />
          <span className="sr-only">Actions for {item.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={disabled}
          onSelect={() => onToggleHidden(item)}
        >
          {item.hidden ? <Eye /> : <EyeOff />}
          {item.hidden ? "Show" : "Hide"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/items/${item.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disabled}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
          onSelect={() => onRequestDelete(item)}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
