"use client";

import { Menu } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function SidebarTriggers() {
  return (
    <>
      <SidebarTrigger className="h-11 w-auto min-w-11 gap-2 px-3 text-gray-700 md:hidden">
        <Menu className="h-5 w-5" />
        <span className="text-sm font-medium">Menu</span>
      </SidebarTrigger>
      <SidebarTrigger className="hidden text-gray-700 md:inline-flex" />
    </>
  );
}
