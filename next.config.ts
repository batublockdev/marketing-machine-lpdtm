import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'police-features-vast-bring.trycloudflare.com',
    'cruz-tyler-buyers-start.trycloudflare.com',
    'timer-silence-foto-thomson.trycloudflare.com',
    'marketing-machine-lpdtm-production.up.railway.app',
  ],
  // Serve files from uploads directory
  serverExternalPackages: ['fs', 'path'],
  // Ensure proper build output
  experimental: {
    // Enable if needed for stability
  },
};

export default nextConfig;