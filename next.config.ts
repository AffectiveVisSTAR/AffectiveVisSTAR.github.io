import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  }
  // devIndicators: false
};

export default nextConfig;
