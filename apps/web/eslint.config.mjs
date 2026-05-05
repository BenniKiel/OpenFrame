import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/preview/motion-pro/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "gsap",
              message: "Import GSAP only from src/lib/preview/motion-pro/*.",
            },
            {
              name: "gsap/ScrollTrigger",
              message: "Import ScrollTrigger only from src/lib/preview/motion-pro/*.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
