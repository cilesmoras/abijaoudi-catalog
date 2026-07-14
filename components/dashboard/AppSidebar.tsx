"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Tags,
} from "lucide-react";

import type { Plan } from "@/lib/types";
import { isPro } from "@/lib/plans";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { RequestUpgradeButton } from "@/components/dashboard/RequestUpgradeButton";
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
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Items", href: "/dashboard/items", icon: Package },
  { title: "Categories", href: "/dashboard/categories", icon: Tags },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar({
  handle,
  plan,
  email,
  isAdmin = false,
  upgradeRequested = false,
}: {
  handle: string;
  plan: Plan;
  email?: string | null;
  isAdmin?: boolean;
  upgradeRequested?: boolean;
}) {
  const pathname = usePathname();
  const pro = isPro(plan);
  const { setOpenMobile } = useSidebar();
  const closeMobileSidebar = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5"
          title="Cataloo home"
          onClick={closeMobileSidebar}
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
                    <Link href={item.href} onClick={closeMobileSidebar}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {isAdmin ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/admin")}
                  tooltip="Admin"
                >
                  <Link href="/dashboard/admin" onClick={closeMobileSidebar}>
                    <Shield />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View public catalog">
                <a
                  href={`/${handle}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMobileSidebar}
                >
                  <ExternalLink />
                  <span>View public catalog</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <FeedbackDialog defaultEmail={email ?? null} />
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
            <RequestUpgradeButton
              alreadyRequested={upgradeRequested}
              className="w-fit px-0.5 text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
              requestedClassName="px-0.5 text-xs font-medium text-emerald-600"
            />
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
