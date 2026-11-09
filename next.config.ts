import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/WASM database drivers must stay outside the server bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
