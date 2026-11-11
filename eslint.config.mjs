import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "data/**", "public/**", "next-env.d.ts"]),
  {
    rules: {
      // Product screenshots are static, pre-sized assets; next/image adds nothing for them.
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "error",
    },
  },
  {
    // The logger and command-line scripts may write to the console.
    files: ["lib/server/logger.ts", "video/**/*.mjs", "scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
]);
