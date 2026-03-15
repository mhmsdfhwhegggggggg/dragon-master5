import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Load real credentials from .env.test for all integration tests
    env: {}, // placeholder - see envFile loading below
    globalSetup: [],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run all integration tests in the same process for shared env
      },
    },
    testTimeout: 60000,
    hookTimeout: 30000,
    include: ["tests/integration-*.test.ts"],
    reporters: "verbose",
    setupFiles: ["./tests/integration-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
