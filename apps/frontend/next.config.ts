import type { NextConfig } from "next";
import { resolve } from "node:path";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@stock-alert/shared-types"],
  outputFileTracingRoot: resolve(__dirname, "../.."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
