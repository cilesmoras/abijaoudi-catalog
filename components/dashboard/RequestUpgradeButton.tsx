"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { requestUpgrade } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Lets a Free user ask to upgrade, with an optional note. There's no payment
 * provider yet, so this flags the profile for the admin users page and emails
 * the owner. Reusable across the sidebar, dashboard, and items pages via
 * `className`.
 */
export function RequestUpgradeButton({
  alreadyRequested = false,
  className,
  requestedClassName,
  label = "Upgrade to Pro",
}: {
  alreadyRequested?: boolean;
  className?: string;
  requestedClassName?: string;
  label?: string;
}) {
  const [requested, setRequested] = useState(alreadyRequested);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (requested) {
    return (
      <span
        className={
          requestedClassName ?? "text-xs font-medium text-emerald-600"
        }
      >
        Upgrade requested — we&apos;ll be in touch ✓
      </span>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestUpgrade(message.trim() || null);
      setRequested(true);
      setOpen(false);
      toast.success("Request received — we'll contact you to activate Pro.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "w-fit text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
          }
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a Pro upgrade</DialogTitle>
          <p className="text-sm text-muted-foreground">
            We&apos;ll get in touch to confirm payment and activate Pro on your
            catalog. Add a note if you have any questions (optional).
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upgrade-message">Message (optional)</Label>
            <Textarea
              id="upgrade-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Anything you'd like us to know…"
              rows={4}
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
