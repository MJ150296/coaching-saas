import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only transpile necessary packages
  transpilePackages: ["next-auth", "mongoose", "bcryptjs"],
  // Optimize package imports to reduce memory
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Disable TypeScript type checking during builds to reduce memory usage
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: ESLint checking is disabled by not running `next lint` during builds.
  // In Next.js 13+, ESLint is no longer integrated into the build process.
};

export default nextConfig;
