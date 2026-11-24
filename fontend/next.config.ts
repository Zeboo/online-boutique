import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development status pill out of the storefront UI. This does not
  // disable Next.js caching or hide compile/runtime errors.
  devIndicators: false,
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"}/uploads/:path*`,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
