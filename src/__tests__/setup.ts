beforeAll(() => {
  console.log('Setting up electron-audio-shot tests...');
});

afterAll(() => {
  console.log('Cleaning up electron-audio-shot tests...');
});

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}; 