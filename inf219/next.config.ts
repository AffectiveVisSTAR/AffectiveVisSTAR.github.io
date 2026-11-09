import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (only static files are served).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
