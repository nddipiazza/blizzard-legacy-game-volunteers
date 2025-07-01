/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/models/(.*)$': '<rootDir>/src/models/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Increased timeout for async tests
  testTimeout: 10000,
};

// Export the config
module.exports = config;
