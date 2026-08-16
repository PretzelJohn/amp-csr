import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript", "oxc"],
  categories: {},
  rules: {
    "react/rules-of-hooks": "error",
  },
});
