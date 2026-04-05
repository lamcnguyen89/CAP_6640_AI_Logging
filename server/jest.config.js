/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/common/',
    '<rootDir>/src/config',
    '<rootDir>/src/routes/owl',
    '<rootDir>/src/types',
    '<rootDir>/src/serverConstants.ts',
    '<rootDir>/src/routes/api/study.ts',
    '<rootDir>/src/routes/api/survey.ts',
    '<rootDir>/src/models/Survey.ts',
    '<rootDir>/src/models/Study.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/common/'  // Ignore the common folder for tests
  ],
  collectCoverageFrom: [
    'src/**/*.ts', // Include all TypeScript files in src folder
    '!src/**/index.ts', // Optionally exclude index files
  ],
};
