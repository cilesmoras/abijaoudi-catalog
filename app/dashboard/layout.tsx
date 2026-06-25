import { getCurrentUser, requireProfile } from "@/lib/dal";
import { isAdmin } from "@/lib/admin";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const user = await getCurrentUser();

  return (
    <SidebarProvider>
      <AppSidebar
        handle={profile.handle}
        plan={profile.plan}
        email={profile.contact_email}
        isAdmin={isAdmin(user?.email)}
        upgradeRequested={Boolean(profile.upgrade_requested_at)}
      />
      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-200/70 bg-white/70 px-4 backdrop-blur-xl">
          <SidebarTrigger className="text-gray-700" />
          <span className="text-sm font-semibold text-gray-900">
            {profile.catalog_name}
          </span>
        </header>
        {children}
      </div>
    </SidebarProvider>
  );
}
