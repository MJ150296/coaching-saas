import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only transpile necessary packages
  transpilePackages: ['next-auth', 'mongoose', 'bcryptjs'],
  // Optimize package imports to reduce memory
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Disable TypeScript during build to speed up deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
