import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/* eslint-disable-next-line @typescript-eslint/no-deprecated --
   TODO: fix, see https://typescript-eslint.io/packages/typescript-eslint/#config-deprecated */
export default tseslint.config({
    files: ["**/*.{ts,mts,mjs}"],
    extends: [
        eslint.configs.recommended,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
        parserOptions: { projectService: true },
    },
    rules: {
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "@typescript-eslint/no-non-null-assertion": "off",
    },
});
