"use client";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={() => void handleLogout()}>
      Log out
    </Button>
  );
}
