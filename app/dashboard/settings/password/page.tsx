import { BackLink } from "@/components/dashboard/BackLink";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { requireProfile, requireUser, userHasPassword } from "@/lib/dal";

export const metadata = { title: "Password | Cataloo" };

export default async function DashboardPasswordPage() {
  const [user] = await Promise.all([requireUser(), requireProfile()]);
  const hasPassword = await userHasPassword(user.id);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BackLink href="/dashboard/settings" label="Back to settings" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {hasPassword ? "Change password" : "Set a password"}
          </h1>
          <p className="text-gray-600">
            {hasPassword
              ? "This signs you out on your other devices."
              : "You sign in with Google or Facebook. Add a password to also sign in with your email."}
          </p>
        </div>
      </div>

      <PasswordForm hasPassword={hasPassword} email={user.email ?? null} />
    </main>
  );
}
