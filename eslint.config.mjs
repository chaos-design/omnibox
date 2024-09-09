import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['menu.mjs'],
  },
  ...compat.extends(
    'next/core-web-vitals',
    'prettier',
    'plugin:@typescript-eslint/recommended',
  ),
  {
    plugins: {
      prettier,
      'unused-imports': unusedImports,
    },

    rules: {
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@next/next/no-duplicate-head': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      'unused-imports/no-unused-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',
      'space-in-parens': 'error',
      'no-empty': 'error',
      'no-multiple-empty-lines': 'error',
      'no-irregular-whitespace': 'error',
      strict: ['error', 'never'],
      'linebreak-style': ['error', 'unix'],

      quotes: [
        'error',
        'double',
        {
          avoidEscape: true,
        },
      ],

      semi: ['error', 'always'],
      'prefer-const': 'error',

      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
    },
  },
];
