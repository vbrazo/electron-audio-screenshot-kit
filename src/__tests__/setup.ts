// Jest setup file for electron-audio-screenshot-kit tests

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  console.log('Setting up electron-audio-screenshot-kit tests...');
});

afterAll(() => {
  // Clean up any global test resources
  console.log('Cleaning up electron-audio-screenshot-kit tests...');
});

// Mock global objects that might not exist in test environment
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}; 