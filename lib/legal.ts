// Single source for the identity and dates shown on /terms, /privacy and
// /refund. Paddle's domain review reads these pages, so keep them accurate.
export const LEGAL = {
  operator: "Cesar Ian Lesmoras",
  location: "Pagadian City, Philippines",
  supportEmail: "support@cataloo.app",
  siteUrl: "https://cataloo.app",
  // Bump when the wording of a legal page materially changes.
  lastUpdated: "November 27, 2026",
  refundWindowDays: 14,
} as const;
