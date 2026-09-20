import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "@solarisdk/browser",
    "@solarisdk/sandbox",
  ],
};

export default nextConfig;
