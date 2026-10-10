import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

/**
 * The bot back-office's front (PFA-127). Next 16.4 with the React Compiler in its Rust version, and
 * deliberately **without** Cache Components (`cacheComponents` / `partialPrefetching` stay off):
 * every page is live data, rendered per request. The CSP lives in `src/proxy.ts` (per-request nonce).
 */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
  },
  turbopack: {
    // `bots/`, not `bots/front`: the API contract (`../nest-api/src/contracts`) is read from source.
    root: fileURLToPath(new URL("..", import.meta.url)),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
