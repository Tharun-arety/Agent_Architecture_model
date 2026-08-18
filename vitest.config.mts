import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * The `@/` alias, so tests import modules by the same path the app does.
 *
 * Without this a test either uses relative paths or cannot import anything that
 * uses the alias internally, which quietly limits what is testable. It mirrors
 * `paths` in tsconfig.json, and those two are the pair to keep in step.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    include: ["evals/**/*.test.ts"],
  },
});
