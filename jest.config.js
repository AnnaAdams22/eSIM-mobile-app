/**
 * Jest config for the ESIM Global app.
 *
 * Uses the Expo-recommended `jest-expo` preset so Babel transforms match the app
 * (TypeScript, the `@/` path alias, and RN/Expo module resolution). The current
 * suite covers the pure catalog data layer in `src/features/catalog`.
 */

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};
