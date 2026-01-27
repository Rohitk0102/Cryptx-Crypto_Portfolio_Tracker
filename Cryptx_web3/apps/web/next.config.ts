import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empty turbopack config to silence webpack warning in Next.js 16
  turbopack: {},
};

export default nextConfig;
