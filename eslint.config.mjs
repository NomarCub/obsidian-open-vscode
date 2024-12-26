// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
    {
        files: ["**/*.ts", "**/*.mjs"],
        extends: [
            eslint.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            stylistic.configs["recommended-flat"],
        ],
        languageOptions: {
            parserOptions: { projectService: true, project: true },
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": [
                "error", { allowExpressions: true },
            ],

            // formatting
            "@stylistic/indent": ["warn", 4],
            "@stylistic/member-delimiter-style": ["warn",
                { multiline: { delimiter: "semi", requireLast: true } },
            ],
            "@stylistic/semi": ["warn", "always"],
            "@stylistic/quotes": ["warn", "double", { avoidEscape: true }],
            "@stylistic/brace-style": ["warn", "1tbs"],
            "@stylistic/arrow-parens": ["warn", "as-needed"],
        },
    },
    {
        files: ["**/*.mjs"],
        extends: [tseslint.configs.disableTypeChecked],
    },
);
