import os from "node:os";
import type { NextConfig } from "next";

function getLocalNetworkOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        origins.add(entry.address);
      }
    }
  }
  if (process.env.ALLOWED_DEV_ORIGIN) {
    origins.add(process.env.ALLOWED_DEV_ORIGIN);
  }
  return Array.from(origins);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: getLocalNetworkOrigins(),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
