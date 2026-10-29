import type { NextConfig } from "next";
import { LEGACY_ROUTE_REDIRECTS } from "./src/shared/routing/route-registry";

/**
 * Build-time performance knobs for Vercel / `next build`.
 * - optimizePackageImports: tree-shake barrel packages (lucide, recharts, …)
 * - serverExternalPackages: skip bundling heavy Node-only libs into server graphs
 */
const nextConfig: NextConfig = {
  devIndicators: false,
  // Next traces Node exports; the Workers bundler selects ESM/browser exports.
  // Include those alternate files for both route and Node proxy bundles.
  outputFileTracingIncludes: {
    "**/*": [
      "node_modules/@opentelemetry/api/build/esm/**/*.js",
      "node_modules/uncrypto/dist/**/*",
      "node_modules/jwks-rsa/node_modules/jose/dist/**/*",
    ],
  },
  async redirects() {
    return [...LEGACY_ROUTE_REDIRECTS];
  },

  // Proxy Firebase OAuth helper requests without changing the browser URL.
  // This supports same-origin redirect authentication on modern browsers.
  async rewrites() {
    return [
      { source: "/__/auth/:path*", destination: "https://smart-khotiyan.firebaseapp.com/__/auth/:path*" },
      { source: "/__/firebase/init.json", destination: "https://smart-khotiyan.firebaseapp.com/__/firebase/init.json" },
    ];
  },

  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "firebase",
      "firebase/auth",
      "firebase/firestore",
      "firebase/app",
      "@hookform/resolvers",
      "zod",
      "sonner",
      "cmdk",
      "radix-ui",
    ],
  },

  // Bundle the fetch-based Upstash client: the experimental Workers proxy
  // adapter otherwise leaves its relative ESM chunks unresolved.
  serverExternalPackages: [
    "firebase-admin",
    "ioredis",
    "pino",
    "pino-pretty",
    "cloudinary",
  ],
};

export default nextConfig;
