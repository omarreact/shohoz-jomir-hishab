import type { NextConfig } from "next";

/**
 * Build-time performance knobs for Vercel / `next build`.
 * - optimizePackageImports: tree-shake barrel packages (lucide, recharts, …)
 * - serverExternalPackages: skip bundling heavy Node-only libs into server graphs
 */
const nextConfig: NextConfig = {
  devIndicators: false,

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

  /** Shrink transpile work for large icon / chart / Firebase client barrels */
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

  /** Keep native / large server deps out of the webpack/turbopack server graph */
  serverExternalPackages: [
    "firebase-admin",
    "bullmq",
    "ioredis",
    "pino",
    "pino-pretty",
    "prom-client",
    "cloudinary",
    "bcryptjs",
    "jsonwebtoken",
    "opossum",
    "redlock",
    "@upstash/redis",
  ],
};

export default nextConfig;
