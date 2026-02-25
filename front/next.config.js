const isStaticExport = process.env.NEXT_OUTPUT_MODE === 'export';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Les requêtes API sont gérées directement dans useRequestHelper.js
  turbopack: {
    // Indicates to Next.js that the workspace root is this directory (pfa-client-next)
    // to avoid warnings about multiple lockfiles
    root: __dirname
  }
};

module.exports = nextConfig;
