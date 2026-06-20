import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Arrow-only back button shown to the left of a dashboard page title. */
export function BackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={href} aria-label={label} title={label}>
        <ArrowLeft className="h-5 w-5" />
      </Link>
    </Button>
  );
}
