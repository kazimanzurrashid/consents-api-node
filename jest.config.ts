import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src/'],
  testEnvironment: 'node',
  verbose: true,
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    }
  }
};

export default config;
