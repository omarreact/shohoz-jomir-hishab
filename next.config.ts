import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/landbd",
        destination: "https://landbd.pincodeit.com",
      },
      {
        source: "/api/landbd/:path*",
        destination: "https://landbd.pincodeit.com/:path*",
      },
    ];
  },
};

export default nextConfig;
