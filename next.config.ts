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

export default async function config(): Promise<NextConfig> {
  if (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "research/full-khatian-discovery"
  ) {
    const { runDlrmsDiscovery } = await import("./scripts/dlrms-discover-build.mjs");
    await runDlrmsDiscovery();
  }
  return nextConfig;
}
