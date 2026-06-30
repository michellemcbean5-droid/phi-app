import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    define: {
      __DEV__: 'false',
    },
  },
  define: {
    __DEV__: 'false',
  },
});
