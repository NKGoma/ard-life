import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for catching potential issues
  reactStrictMode: true,

  // Optimize build output
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Experimental performance features
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },
};

export default nextConfig;
