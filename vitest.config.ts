import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/domain/**/*.test.ts', 'src/application/**/*.test.ts', 'src/lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/domain/**', 'src/application/**'],
      // Pure type-only files (entities, repository interfaces, the shared
      // use-case context type) compile to no runtime statements at all — they
      // have nothing to cover and Section 16's build order explicitly treats
      // them as "no logic yet, just types". Excluding them keeps the
      // threshold measuring actual tested logic instead of being diluted by
      // files that can never be exercised.
      exclude: ['src/domain/entities/**', 'src/domain/repositories/**', 'src/application/context.ts'],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
