// ============================================================================
// INTEGRATION TESTS FOR CONTEXTOR
// ============================================================================
// These tests verify the integration between electron-platform-audio-screenshot and Contextor

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock Electron for testing
const mockElectron = {
  ipcMain: {
    handle: jest.fn(),
  },
  desktopCapturer: {
    getSources: jest.fn(),
  },
  systemPreferences: {
    getMediaAccessStatus: jest.fn(),
    askForMediaAccess: jest.fn(),
  },
};

// Mock the electron module
jest.mock('electron', () => mockElectron);

describe('Contextor Integration Tests', () => {
  let platformAudioScreenshotService;
  let mockSpawn;
  let mockFs;

  beforeAll(() => {
    // Mock Node.js modules
    jest.mock('child_process', () => ({
      spawn: jest.fn(),
      execFile: jest.fn(),
    }));

    jest.mock('fs', () => ({
      existsSync: jest.fn(),
      promises: {
        readFile: jest.fn(),
        unlink: jest.fn(),
      },
    }));

    jest.mock('os', () => ({
      tmpdir: jest.fn(() => '/tmp'),
    }));

    jest.mock('path', () => ({
      join: jest.fn((...args) => args.join('/')),
    }));

    jest.mock('sharp', () => {
      return jest.fn(() => ({
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
        metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
      }));
    });

    // Import the service after mocking
    platformAudioScreenshotService = require('../src/main/platformAudioScreenshotService').platformAudioScreenshotService;
    mockSpawn = require('child_process').spawn;
    mockFs = require('fs');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
    });
  });

  describe('Platform Detection', () => {
    it('should detect macOS correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const service = new platformAudioScreenshotService();
      assert.strictEqual(service.getPlatform(), 'macos');
    });

    it('should detect Windows correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new platformAudioScreenshotService();
      assert.strictEqual(service.getPlatform(), 'windows');
    });

    it('should detect Linux correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new platformAudioScreenshotService();
      assert.strictEqual(service.getPlatform(), 'linux');
    });
  });

  describe('Permission Handling', () => {
    it('should handle macOS permissions correctly', async () => {
      mockElectron.systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      mockElectron.desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);

      const service = new platformAudioScreenshotService();
      const result = await service.checkSystemPermissions();

      assert.deepStrictEqual(result, {
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });

    it('should handle Windows permissions correctly', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new platformAudioScreenshotService();
      const result = await service.checkSystemPermissions();

      assert.deepStrictEqual(result, {
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });

    it('should handle Linux permissions correctly', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new platformAudioScreenshotService();
      const result = await service.checkSystemPermissions();

      assert.deepStrictEqual(result, {
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });
  });

  describe('Audio Capture', () => {
    it('should start macOS audio capture', async () => {
      mockElectron.systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      mockElectron.desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(true);
      mockSpawn.mockReturnValue({
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      });

      const service = new platformAudioScreenshotService();
      const result = await service.startAudioCapture();

      assert.deepStrictEqual(result, { success: true });
      assert(mockSpawn.called);
    });

    it('should start Windows audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new platformAudioScreenshotService();
      const result = await service.startAudioCapture();

      assert.deepStrictEqual(result, { success: true });
    });

    it('should start Linux audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new platformAudioScreenshotService();
      const result = await service.startAudioCapture();

      assert.deepStrictEqual(result, { success: true });
    });
  });

  describe('Screenshot Capture', () => {
    it('should capture macOS screenshot', async () => {
      const mockExecFile = require('child_process').execFile;
      mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
      mockFs.promises.readFile.mockResolvedValue(Buffer.from('mock-screenshot'));

      const service = new platformAudioScreenshotService();
      const result = await service.captureScreenshot({ quality: 'high' });

      assert.strictEqual(result.success, true);
      assert(result.base64);
      assert.strictEqual(result.width, 1920);
      assert.strictEqual(result.height, 1080);
    });

    it('should capture cross-platform screenshot', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      mockElectron.desktopCapturer.getSources.mockResolvedValue([
        {
          id: 'screen:0',
          thumbnail: {
            toJPEG: jest.fn(() => Buffer.from('mock-jpeg')),
            getSize: jest.fn(() => ({ width: 1920, height: 1080 })),
          },
        },
      ]);

      const service = new platformAudioScreenshotService();
      const result = await service.captureScreenshot({ quality: 'medium' });

      assert.strictEqual(result.success, true);
      assert(result.base64);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const service = new platformAudioScreenshotService();
      const newConfig = {
        sampleRate: 48000,
        echoCancellationSensitivity: 'high',
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      assert.strictEqual(config.sampleRate, 48000);
      assert.strictEqual(config.echoCancellationSensitivity, 'high');
    });

    it('should get current configuration', () => {
      const service = new platformAudioScreenshotService();
      const config = service.getConfig();

      assert(config);
      assert.strictEqual(typeof config.sampleRate, 'number');
      assert.strictEqual(typeof config.channels, 'number');
      assert.strictEqual(typeof config.bitsPerSample, 'number');
    });
  });

  describe('IPC Handlers', () => {
    it('should register all IPC handlers', () => {
      const service = new platformAudioScreenshotService();
      service.setupIpcHandlers();

      const expectedHandlers = [
        'platform-audio:check-permissions',
        'platform-audio:request-microphone-permission',
        'platform-audio:open-system-preferences',
        'platform-audio:start-capture',
        'platform-audio:stop-capture',
        'platform-audio:capture-screenshot',
        'platform-audio:get-platform',
        'platform-audio:get-config',
        'platform-audio:update-config',
      ];

      expectedHandlers.forEach(handler => {
        assert(mockElectron.ipcMain.handle.calledWith(handler, sinon.match.func));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing binary error', async () => {
      mockElectron.systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      mockElectron.desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(false);

      const service = new platformAudioScreenshotService();
      
      try {
        await service.startAudioCapture();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('SystemAudioDump binary not found'));
      }
    });

    it('should handle permission errors', async () => {
      mockElectron.systemPreferences.getMediaAccessStatus.mockReturnValue('denied');
      mockElectron.desktopCapturer.getSources.mockRejectedValue(new Error('Permission denied'));

      const service = new platformAudioScreenshotService();
      
      try {
        await service.startAudioCapture();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('System permissions need to be configured'));
      }
    });
  });
});

// ============================================================================
// CONTEXTOR SPECIFIC INTEGRATION TESTS
// ============================================================================

describe('Contextor Specific Integration', () => {
  it('should integrate with Contextor main process', () => {
    // Test that the service can be imported and used in Contextor
    const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
    
    // Simulate Contextor main process integration
    class ContextorApp {
      constructor() {
        this.platformAudioScreenshotService = new platformAudioScreenshotService({
          sampleRate: 24000,
          chunkDuration: 0.1,
          enableEchoCancellation: true,
          echoCancellationSensitivity: 'medium',
        });
      }

      setupIpcHandlers() {
        this.platformAudioScreenshotService.setupIpcHandlers();
      }
    }

    const app = new ContextorApp();
    app.setupIpcHandlers();

    assert(app.platformAudioScreenshotService);
    assert.strictEqual(typeof app.platformAudioScreenshotService.getPlatform, 'function');
    assert.strictEqual(typeof app.platformAudioScreenshotService.getConfig, 'function');
  });

  it('should handle Contextor audio recording workflow', async () => {
    const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
    
    // Mock successful permissions and capture
    mockElectron.systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
    mockElectron.desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
    mockFs.existsSync.mockReturnValue(true);
    mockSpawn.mockReturnValue({
      pid: 12345,
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn(),
    });

    const service = new platformAudioScreenshotService();

    // Simulate Contextor conversation recording workflow
    const startResult = await service.startAudioCapture();
    assert.strictEqual(startResult.success, true);

    // Simulate stopping recording
    const stopResult = await service.stopAudioCapture();
    assert.strictEqual(stopResult.success, true);
  });

  it('should handle Contextor screenshot capture', async () => {
    const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
    
    const mockExecFile = require('child_process').execFile;
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockFs.promises.readFile.mockResolvedValue(Buffer.from('mock-screenshot'));

    const service = new platformAudioScreenshotService();

    // Simulate Contextor context screenshot capture
    const result = await service.captureScreenshot({ 
      quality: 'medium',
      format: 'jpeg'
    });

    assert.strictEqual(result.success, true);
    assert(result.base64);
    assert.strictEqual(result.width, 1920);
    assert.strictEqual(result.height, 1080);
  });
});

// ============================================================================
// PLATFORM COMPATIBILITY TESTS
// ============================================================================

describe('Platform Compatibility', () => {
  const platforms = ['darwin', 'win32', 'linux'];

  platforms.forEach(platform => {
    describe(`${platform} compatibility`, () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', { value: platform });
      });

      it(`should initialize on ${platform}`, () => {
        const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
        const service = new platformAudioScreenshotService();
        
        assert(service);
        assert.strictEqual(typeof service.getPlatform, 'function');
        assert.strictEqual(typeof service.getConfig, 'function');
      });

      it(`should check permissions on ${platform}`, async () => {
        const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
        const service = new platformAudioScreenshotService();
        
        const result = await service.checkSystemPermissions();
        
        assert(result);
        assert.strictEqual(typeof result.microphone, 'string');
        assert.strictEqual(typeof result.screen, 'string');
        assert.strictEqual(typeof result.needsSetup, 'boolean');
      });

      it(`should get configuration on ${platform}`, () => {
        const { platformAudioScreenshotService } = require('../src/main/platformAudioScreenshotService');
        const service = new platformAudioScreenshotService();
        
        const config = service.getConfig();
        
        assert(config);
        assert.strictEqual(typeof config.sampleRate, 'number');
        assert.strictEqual(typeof config.channels, 'number');
        assert.strictEqual(typeof config.bitsPerSample, 'number');
        assert.strictEqual(typeof config.chunkDuration, 'number');
        assert.strictEqual(typeof config.enableEchoCancellation, 'boolean');
        assert.strictEqual(typeof config.echoCancellationSensitivity, 'string');
        assert.strictEqual(typeof config.bufferSize, 'number');
      });
    });
  });
}); 