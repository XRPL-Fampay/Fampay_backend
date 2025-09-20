/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  verbose: true,
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/generated/'],
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: [],
  reporters: ['default']
};
