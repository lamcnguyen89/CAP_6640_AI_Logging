import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',  // Equivalent to `testEnvironment: 'jsdom'`
    setupFiles: ['./src/setupTests.ts'],  // Equivalent to `setupFilesAfterEnv`
    globals: true,  // Enable globals if needed for certain Jest-like behaviors

    coverage: {
      provider: 'v8',  // Use v8 for coverage collection
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],  // Output the same reports
      reportsDirectory: './coverage',  // Equivalent to `coverageDirectory`
      all: true,  // Equivalent to `collectCoverage`
      include: ['src/**/*.{js,jsx,ts,tsx}'],  // Include files for coverage
      exclude: [
        'src/**/*.d.ts',
        'src/store/**',
        'src/helpers/**',
        'src/common/**',
        'src/assets/**',
        'src/serviceWorker.ts',
        'src/setupTests.ts',
        'src/index.tsx',
        'src/tests/**',  // Exclude tests directory if needed
      ],  // Equivalent to `collectCoverageFrom` exclusions
    },
  },
})
