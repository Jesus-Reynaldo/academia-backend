import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Every spec shares the same MySQL test database and calls
    // cleanDatabase() in beforeEach, so files must not run concurrently.
    fileParallelism: false,
  },
});
