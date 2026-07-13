import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/infrastructure/**/*.integration.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Integration tests share one Postgres instance and mutate shared tenant rows,
    // so they must not run as concurrent workers against the same connection pool.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
