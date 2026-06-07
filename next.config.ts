import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow admin file uploads (handled via server actions) up to ~55 MB.
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
