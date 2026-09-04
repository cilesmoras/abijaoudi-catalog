import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` pins app identity so a future start_url change cannot orphan
    // existing installs. `scope` was already "/" implicitly; stating it makes
    // it unambiguous that /auth/callback is in-scope, so Android hands the
    // OAuth redirect back to the installed window instead of stranding it.
    id: "/",
    scope: "/",
    name: "Cataloo",
    short_name: "Cataloo",
    description: "Manage and export your supermarket product catalog.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
