import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import shared from '../../packages/eslint-config/index.js';

const compat = new FlatCompat();

export default tseslint.config(
  ...tseslint.configs.recommended,
  js.configs.recommended,
  ...compat.extends('eslint:recommended'),
  {
    rules: {
      ...shared.rules,
      'no-console': 'warn',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
