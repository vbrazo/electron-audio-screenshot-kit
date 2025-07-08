beforeAll(() => {
  console.log('Setting up electron-audio-screenshot-kit tests...');
});

afterAll(() => {
  console.log('Cleaning up electron-audio-screenshot-kit tests...');
});

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}; 