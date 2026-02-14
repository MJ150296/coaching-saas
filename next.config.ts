import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only transpile necessary packages
  transpilePackages: ["next-auth", "mongoose", "bcryptjs"],
  // Optimize package imports to reduce memory
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
