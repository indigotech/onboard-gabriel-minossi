module.exports = {
  parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,  // Allows for the parsing of modern ECMAScript features
    sourceType: 'module',  // Allows for the use of imports
    project: './tsconfig.json'
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. '@typescript-eslint/explicit-function-return-type': 'off',
    'prettier/prettier': ['error', {
      endOfLine: 'auto',
    }],
    'func-call-spacing': 'off',
    'block-scoped-var': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'curly': ['error', 'all'],
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/member-delimiter-style': ['error', {
      singleline: {
        requireLast: false
      }
    }],
  },
};
