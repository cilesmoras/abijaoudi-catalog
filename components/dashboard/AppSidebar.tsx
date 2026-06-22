"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  Tags,
} from "lucide-react";

import type { Plan } from "@/lib/types";
import { isPro } from "@/lib/plans";
import { LogoutButton } from "@/components/admin/LogoutButton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Items", href: "/dashboard/items", icon: Package },
  { title: "Categories", href: "/dashboard/categories", icon: Tags },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar({
  handle,
  plan,
}: {
  handle: string;
  plan: Plan;
}) {
  const pathname = usePathname();
  const pro = isPro(plan);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5"
          title="Cataloo home"
        >
          <Image
            src="/icon-192x192.png"
            alt="Cataloo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg shadow-sm shadow-blue-600/20"
          />
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Cataloo
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View public catalog">
                <a href={`/${handle}`} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  <span>View public catalog</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-3">
        <div className="flex flex-col gap-1.5 px-1 group-data-[collapsible=icon]:hidden">
          <span
            className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              pro ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {pro ? "Pro plan" : "Free plan"}
          </span>
          {!pro ? (
            <Link
              href="/#pricing"
              className="px-0.5 text-xs font-medium text-blue-600 hover:underline"
            >
              Upgrade to Pro
            </Link>
          ) : null}
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <LogoutButton />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
