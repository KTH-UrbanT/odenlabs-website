import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 120_000,
    // build.test.ts builds the site once in beforeAll; give it the same budget.
    hookTimeout: 120_000,
  },
});
