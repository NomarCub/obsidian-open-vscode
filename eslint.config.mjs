import eslint from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
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
    plugins: { obsidianmd },
    languageOptions: {
        parserOptions: { projectService: true },
    },
    // @ts-expect-error -- Temporary fixes for v0.1.9., see https://github.com/obsidianmd/eslint-plugin/issues/90
    rules: {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread 
        ...obsidianmd.configs?.["recommended"],
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "@typescript-eslint/no-non-null-assertion": "off",
    },
});
