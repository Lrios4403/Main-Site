import { plugin } from "bun";
// The standalone audit runs in Bun, outside Next's react-server module conditions.
plugin({ name: "server-only-audit", setup(build) {
  build.module("server-only", () => ({ exports: {}, loader: "object" }));
} });
