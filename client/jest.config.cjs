const path = require('path');

module.exports = {
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/store/**",
    "!src/helpers/**",
    "!src/common/**",
    "!src/assets/**",
    "!src/serviceWorker.ts",
    "!src/setupTests.ts",
    "!src/index.tsx",
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: [
    "json",  // Continue collecting coverage as usual
    "lcov",
    "text-summary",
    // Disable default HTML report generation
  ],
  // Use globalTeardown to run custom HTML reporter after tests and coverage
  globalTeardown: path.resolve(__dirname, './src/tests/run-custom-html-reporter.cjs'),
};
