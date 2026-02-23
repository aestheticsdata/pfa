/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export' uniquement pour les builds de production (pas en dev)
  ...(process.env.NODE_ENV !== 'development' && { output: 'export' }),
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
