import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '#': resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'src/__tests__/**',
        'src/routeTree.gen.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/env.ts',
        'src/main.tsx',
        'src/router.tsx',
        'src/routes/**',
      ],
    },
  },
})
