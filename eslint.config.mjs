import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default defineConfig([
    { ignores: ["main.js"] },
    ...obsidianmd.configs.recommended,
    {
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
            "obsidianmd/ui/sentence-case": [
                "error",
                {
                    brands: ["VS Code", "Visual Studio Code", "VS Code Insiders", "VSCodium"],
                    ignoreRegex: ["Open in VS Code", "link"],
                },
            ],
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "@typescript-eslint/no-non-null-assertion": "off",
            // TODO(#34): re-enable
            "eslint-comments/no-restricted-disable": "off",
            "eslint-comments/require-description": "off",
            "obsidianmd/prefer-create-el": "off",
            "obsidianmd/prefer-window-timers": "off",
        },
    },
]);
