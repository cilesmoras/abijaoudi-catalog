"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { createContext, useCallback, useContext, useRef } from "react";

type CheckoutContext = {
  ownerId: string;
  email: string | null;
  loadPaddle: () => Promise<Paddle>;
};

const Ctx = createContext<CheckoutContext | null>(null);

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const ENV = process.env.NEXT_PUBLIC_PADDLE_ENV;

/** True when Paddle checkout is configured for this deployment. */
export const paddleCheckoutEnabled = Boolean(
  TOKEN && (ENV === "sandbox" || ENV === "production"),
);

/**
 * Supplies the signed-in owner's id/email to upgrade buttons and loads
 * Paddle.js lazily on first use, so dashboard pages don't pay for the script
 * until someone actually upgrades.
 */
export function PaddleCheckoutProvider({
  ownerId,
  email,
  children,
}: {
  ownerId: string;
  email: string | null;
  children: React.ReactNode;
}) {
  const paddleRef = useRef<Promise<Paddle> | null>(null);

  const loadPaddle = useCallback(() => {
    if (!paddleCheckoutEnabled) {
      return Promise.reject(new Error("Paddle checkout is not configured"));
    }
    if (!paddleRef.current) {
      const loading = initializePaddle({
        environment: ENV as "sandbox" | "production",
        token: TOKEN!,
      }).then((paddle) => {
        if (!paddle) throw new Error("Could not load Paddle checkout");
        return paddle;
      });
      // Let a failed load (e.g. offline) be retried on the next click.
      loading.catch(() => {
        paddleRef.current = null;
      });
      paddleRef.current = loading;
    }
    return paddleRef.current;
  }, []);

  return (
    <Ctx.Provider value={{ ownerId, email, loadPaddle }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePaddleCheckout(): CheckoutContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "usePaddleCheckout must be used inside PaddleCheckoutProvider",
    );
  }
  return ctx;
}
