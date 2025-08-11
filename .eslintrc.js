// Это УНИВЕРСАЛЬНЫЙ пример. Поместите его в backend/ и frontend/
// и адаптируйте плагины (например, для React во фронтенде).
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Включает Prettier как правило ESLint
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'prettier/prettier': 'warn', // Помечать проблемы Prettier как предупреждения
    '@typescript-eslint/no-explicit-any': 'off', // Разрешить использование 'any'
    '@typescript-eslint/no-unused-vars': 'warn', // Неиспользуемые переменные - предупреждение
  },
};