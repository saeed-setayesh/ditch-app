/* eslint-disable */

// next.config.js - enhanced with PWA runtime caching and build-time ignores
// Adapted to CommonJS to work reliably with next-pwa and the Next.js build step.

const runtimeCaching = [
  {
    urlPattern: /^https:\/\/your-domain\/.*\.(png|jpg|svg|webp|ico)$/,
    handler: "CacheFirst",
    options: {
      cacheName: "images-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^\/_next\/static\/.*/,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-resources",
      expiration: { maxEntries: 200 },
    },
  },
  {
    urlPattern: /^\/api\/.*/,
    handler: "NetworkFirst",
    options: {
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
    },
  },
];

let withPWA = (config) => config;
try {
  // next-pwa is optional at runtime; requiring in a try/catch avoids hard failures
  // if the package isn't installed in some environments.
  // If you want PWA in production, add `next-pwa` to your dependencies.
  // npm install next-pwa
  // For Next 14+ the import is the same.
  const withPwaFactory = require("next-pwa");
  withPWA = withPwaFactory({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching,
  });
} catch (err) {
  // no-op: continue without PWA if package missing
  // console.warn("next-pwa not installed — skipping PWA config");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence type and lint errors during CI/build if desired.
  // Note: disabling type/lint checks at build can hide real problems — use with care.
  typescript: {
    // Disable TypeScript type errors during build
    ignoreBuildErrors: true,
  },
  // Provide an explicit turbopack root to avoid workspace root inference warnings
  turbopack: {
    root: __dirname,
  },
  // Example header for service worker file (keep if you serve sw.js from root)
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
