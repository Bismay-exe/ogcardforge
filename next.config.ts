import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // satori ships pure JS, but @resvg/resvg-js bundles a native binary that
  // Next.js cannot bundle — let Node resolve them at runtime via require().
  serverExternalPackages: ["satori", "@resvg/resvg-js"],
};

export default nextConfig;
