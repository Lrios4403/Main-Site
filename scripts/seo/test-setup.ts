import { mock } from "bun:test";
// Next resolves this marker on the server. Unit tests run outside Next's bundler.
mock.module("server-only", () => ({}));
