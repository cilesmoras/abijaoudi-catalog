"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Never run the worker in development. Its cache-first handler for
    // /_next/static serves stale dev chunks, so a registration left over from
    // a production visit (or an earlier dev run) silently hides code changes —
    // the page keeps rendering an old build no matter what you edit. Tear down
    // any existing registration and its caches so a dev machine self-heals.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((r) => r.unregister())),
        )
        .catch(() => {});
      if (typeof caches !== "undefined") {
        void caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) =>
        console.error("Service worker registration failed:", err),
      );
  }, []);

  return null;
}
