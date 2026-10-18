module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended'],
    ignorePatterns: ['dist', 'node_modules'],
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                // TypeScript noUnusedLocals/noUnusedParameters handle type references correctly.
                'no-unused-vars': 'off',
                'no-undef': 'off',
            },
        },
        { files: ['*.cjs', '*.config.js'], env: { node: true } },
    ],
};
