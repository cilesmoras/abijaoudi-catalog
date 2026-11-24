/**
 * Turns Supabase Auth errors raised by email-sending calls (sign up, password
 * reset) into messages an owner can act on. Falls back to Supabase's message.
 */
export function emailAuthErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "We're sending a lot of emails right now. Please try again in a few minutes.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
  }
  return error.message;
}
