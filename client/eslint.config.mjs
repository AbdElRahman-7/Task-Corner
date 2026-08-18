import { defineConfig } from "eslint/config";
import pluginNext from "@next/eslint-plugin-next";

const nextPlugin = pluginNext?.default || pluginNext;

export default defineConfig([
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: nextPlugin.configs?.recommended?.rules || {},
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
]);