"use client";

import { FormEvent, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { submitFeedback } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function FeedbackDialog({ defaultEmail }: { defaultEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        email: email.trim() ? email.trim() : null,
        message: message.trim(),
      });
      toast.success("Thanks — your feedback was sent.");
      setMessage("");
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send feedback";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton title="Send feedback">
          <MessageCircle />
          <span>Send feedback</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Found a bug or have an idea? Send it straight to the Cataloo team.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-email">Your email</Label>
            <Input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll only use this to reply to you.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what's on your mind…"
              rows={5}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
