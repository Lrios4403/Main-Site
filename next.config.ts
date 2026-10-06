import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image runs .next/standalone/server.js, which carries only the
  // node_modules files the server actually uses (see Dockerfile)
  output: "standalone",
  turbopack: {
    // The parent folder holds the legacy app and its package-lock.json, which
    // Turbopack otherwise picks as the workspace root, making it watch both
    // apps (and current.zip). Pin the root to this app.
    root: __dirname,
  },
};

export default nextConfig;
