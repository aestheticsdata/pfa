const isStaticExport = process.env.NEXT_OUTPUT_MODE === 'export';
const isDev = process.env.NODE_ENV !== "production";
const localApiHost = process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST;

const devConnectSources = [
  "ws:",
  "wss:",
  "http://localhost:6100",
  "http://127.0.0.1:6100",
];

if (localApiHost) {
  devConnectSources.push(localApiHost);
}

const cspDirectives = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "script-src": [
    "'self'",
    // Next runtime injects inline bootstrap script unless using CSP nonces.
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    ...(isDev ? devConnectSources : []),
  ],
  "frame-src": ["'none'"],
  "worker-src": ["'self'", "blob:"],
};

const contentSecurityPolicy = Object.entries(cspDirectives)
  .map(([directive, values]) => `${directive} ${values.join(" ")}`)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  reactCompiler: true,
  // Static export is now opt-in (NEXT_OUTPUT_MODE=export).
  ...(isStaticExport && { output: 'export' }),
  trailingSlash: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true
  },
  // Les rewrites Next.js ne fonctionnent pas pour les requêtes client-side (Axios)
  // Les requêtes API sont gérées directement dans useRequestHelper.ts
  turbopack: {
    // Indicates to Next.js that the workspace root is this directory (pfa-client-next)
    // to avoid warnings about multiple lockfiles
    root: __dirname
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
