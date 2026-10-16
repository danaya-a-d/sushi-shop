import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Тот же алиас, что в tsconfig.json: "@/*" → корень apps/web
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Окружение по умолчанию node; компонентные тесты включают DOM докблоком `// @vitest-environment jsdom`
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
