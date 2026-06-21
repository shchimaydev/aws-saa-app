import { defineConfig } from "vitest/config";

// Standalone config so Vitest does not load vite.config.ts (the React Router
// plugin there is build/dev-only and isn't meant to run under the test runner).
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
