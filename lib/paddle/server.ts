import "server-only";
import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk";

let instance: Paddle | null = null;

/**
 * Paddle environment from NEXT_PUBLIC_PADDLE_ENV. Never defaulted: running
 * against the wrong account (sandbox vs live) must fail loudly.
 */
export function paddleEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
  if (env === "sandbox") return Environment.sandbox;
  if (env === "production") return Environment.production;
  throw new Error("NEXT_PUBLIC_PADDLE_ENV must be 'sandbox' or 'production'");
}

/** Shared server-side Paddle client. Never import from client code. */
export function getPaddle(): Paddle {
  if (instance) return instance;
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not set");
  instance = new Paddle(apiKey, {
    environment: paddleEnvironment(),
    logLevel: LogLevel.error,
  });
  return instance;
}
