import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      "import/no-unresolved": "error"
    }
  }
];