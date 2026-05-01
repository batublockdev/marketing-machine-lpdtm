import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'police-features-vast-bring.trycloudflare.com',
    'cruz-tyler-buyers-start.trycloudflare.com',
    'timer-silence-foto-thomson.trycloudflare.com',
  ],
};

export default nextConfig;