import type { NextConfig } from "next";

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
