import type { NextConfig } from "next";

// Static export only: no server runtime, no API routes (see CLAUDE.md).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
