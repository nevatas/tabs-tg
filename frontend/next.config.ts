import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Railway deployment
  output: 'standalone',

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
