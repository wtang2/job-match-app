import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite", "pdf-parse", "mammoth"],
};

export default nextConfig;
