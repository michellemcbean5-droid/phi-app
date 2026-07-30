import { defineConfig } from 'vitest/config';
import path from 'path';

// React Native packages ship Flow-typed or raw TypeScript sources that
// Node/Vitest cannot execute. Alias them to lightweight test doubles so the
// app's own logic runs for real while native-bound SDKs stay out of scope.
const mock = (name: string) => path.resolve(__dirname, 'src/__tests__/mocks', name);

export default defineConfig({
  define: {
    __DEV__: 'false',
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    alias: [
      { find: /^react-native$/, replacement: mock('reactNative.ts') },
      { find: /^@stripe\/stripe-react-native$/, replacement: mock('stripeReactNative.ts') },
      { find: /^expo-constants$/, replacement: mock('expoConstants.ts') },
    ],
  },
});
