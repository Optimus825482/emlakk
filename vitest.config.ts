import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.config.{ts,js}",
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**",
      ],
      // Coverage thresholds
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
    include: ["**/*.{test,spec}.{js,ts,tsx,jsx}"],
    exclude: ["node_modules", "dist", ".next", "coverage"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  // Mock Next.js modules for vitest
  define: {
    "import.meta.env.TEST": "true",
  },
});
