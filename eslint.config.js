import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude', '.netlify', 'public/transcription-models']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Error (not warning) so existing cases can live in eslint-suppressions.json.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // Server-side code: Netlify functions, dev server, Node tests.
    files: ['netlify/**/*.ts', 'src/api/**/*.ts', 'tests/**/*.{ts,mjs}', 'scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
])
