import { audioScreenshotService } from '../main/audioScreenshotService';
import { AudioCaptureConfig, PermissionStatus, Platform } from '../types';
import { AUDIO_CONFIGS, PLATFORMS } from '../constants';

// Mock Electron modules
jest.mock('electron', () => ({
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
}));

// Mock Node.js modules
jest.mock('child_process', () => ({
  spawn: jest.fn(),
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

jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  }));
});

describe('audioScreenshotService', () => {
  let audioScreenshotService: audioScreenshotService;
  let mockSpawn: jest.Mocked<any>;
  let mockFs: jest.Mocked<any>;
  let mockPath: jest.Mocked<any>;
  let mockOs: jest.Mocked<any>;
  let mockExecFile: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockSpawn = require('child_process').spawn;
    mockFs = require('fs');
    mockPath = require('path');
    mockOs = require('os');
    mockExecFile = require('child_process').execFile;

    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
    });

    audioScreenshotService = new audioScreenshotService();
  });

  describe('Constructor', () => {
    it('should initialize with default config for macOS', () => {
      expect(audioScreenshotService.getPlatform()).toBe(PLATFORMS.MACOS);
      expect(audioScreenshotService.getConfig()).toEqual(AUDIO_CONFIGS.macos);
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<AudioCaptureConfig> = {
        sampleRate: 48000,
        chunkDuration: 0.05,
      };

      const service = new audioScreenshotService(customConfig);
      const config = service.getConfig();

      expect(config.sampleRate).toBe(48000);
      expect(config.chunkDuration).toBe(0.05);
      expect(config.channels).toBe(AUDIO_CONFIGS.macos.channels); // Should merge with defaults
    });

    it('should detect Windows platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();
      expect(service.getPlatform()).toBe(PLATFORMS.WINDOWS);
    });

    it('should detect Linux platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new audioScreenshotService();
      expect(service.getPlatform()).toBe(PLATFORMS.LINUX);
    });
  });

  describe('checkSystemPermissions', () => {
    it('should check macOS permissions correctly', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);

      const result = await audioScreenshotService.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });

    it('should handle macOS permission denial', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('denied');
      desktopCapturer.getSources.mockRejectedValue(new Error('Permission denied'));

      const result = await audioScreenshotService.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'denied',
        screen: 'denied',
        needsSetup: true,
      });
    });

    it('should handle Windows permissions', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();

      const result = await service.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });

    it('should handle Linux permissions', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new audioScreenshotService();

      const result = await service.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });
  });

  describe('requestMicrophonePermission', () => {
    it('should return granted for non-macOS platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();

      const result = await service.requestMicrophonePermission();

      expect(result).toEqual({
        success: true,
        status: 'granted',
      });
    });

    it('should request microphone permission on macOS', async () => {
      const { systemPreferences } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('not-determined');
      systemPreferences.askForMediaAccess.mockResolvedValue(true);

      const result = await audioScreenshotService.requestMicrophonePermission();

      expect(result).toEqual({
        success: true,
        status: 'granted',
      });
      expect(systemPreferences.askForMediaAccess).toHaveBeenCalledWith('microphone');
    });

    it('should handle permission denial on macOS', async () => {
      const { systemPreferences } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('not-determined');
      systemPreferences.askForMediaAccess.mockResolvedValue(false);

      const result = await audioScreenshotService.requestMicrophonePermission();

      expect(result).toEqual({
        success: false,
        status: 'denied',
      });
    });
  });

  describe('openSystemPreferences', () => {
    it('should return error for non-macOS platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();

      const result = await service.openSystemPreferences('screen-recording');

      expect(result).toEqual({
        success: false,
        error: 'Not supported on this platform',
      });
    });

    it('should trigger screen capture request on macOS', async () => {
      const { desktopCapturer } = require('electron');
      
      desktopCapturer.getSources.mockRejectedValue(new Error('Expected failure'));

      const result = await audioScreenshotService.openSystemPreferences('screen-recording');

      expect(result).toEqual({
        success: true,
      });
      expect(desktopCapturer.getSources).toHaveBeenCalledWith({
        types: ['screen'],
        thumbnailSize: { width: 1, height: 1 },
      });
    });
  });

  describe('startAudioCapture', () => {
    it('should start macOS audio capture', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(true);
      mockSpawn.mockReturnValue({
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      });

      const result = await audioScreenshotService.startAudioCapture();

      expect(result).toEqual({ success: true });
      expect(mockSpawn).toHaveBeenCalled();
    });

    it('should handle missing SystemAudioDump binary', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(false);

      await expect(audioScreenshotService.startAudioCapture()).rejects.toThrow(
        'SystemAudioDump binary not found'
      );
    });

    it('should handle permission errors', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('denied');
      desktopCapturer.getSources.mockRejectedValue(new Error('Permission denied'));

      await expect(audioScreenshotService.startAudioCapture()).rejects.toThrow(
        'System permissions need to be configured'
      );
    });

    it('should start Windows audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();

      const result = await service.startAudioCapture();

      expect(result).toEqual({ success: true });
    });

    it('should start Linux audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const service = new audioScreenshotService();

      const result = await service.startAudioCapture();

      expect(result).toEqual({ success: true });
    });
  });

  describe('stopAudioCapture', () => {
    it('should stop macOS audio capture', async () => {
      // Setup a running capture
      const { systemPreferences, desktopCapturer } = require('electron');
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(true);
      mockSpawn.mockReturnValue({
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      });

      await audioScreenshotService.startAudioCapture();
      const result = await audioScreenshotService.stopAudioCapture();

      expect(result.success).toBe(true);
    });

    it('should return success when not capturing', async () => {
      const result = await audioScreenshotService.stopAudioCapture();

      expect(result).toEqual({ success: true });
    });
  });

  describe('captureScreenshot', () => {
    it('should capture macOS screenshot', async () => {
      mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
      mockFs.promises.readFile.mockResolvedValue(Buffer.from('mock-screenshot'));

      const result = await audioScreenshotService.captureScreenshot({ quality: 'high' });

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should capture cross-platform screenshot', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new audioScreenshotService();
      
      const { desktopCapturer } = require('electron');
      desktopCapturer.getSources.mockResolvedValue([
        {
          id: 'screen:0',
          thumbnail: {
            toJPEG: jest.fn(() => Buffer.from('mock-jpeg')),
            getSize: jest.fn(() => ({ width: 1920, height: 1080 })),
          },
        },
      ]);

      const result = await service.captureScreenshot({ quality: 'medium' });

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
    });

    it('should handle screenshot capture errors', async () => {
      mockExecFile.mockRejectedValue(new Error('Screenshot failed'));

      const result = await audioScreenshotService.captureScreenshot();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Screenshot failed');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<AudioCaptureConfig> = {
        sampleRate: 48000,
        echoCancellationSensitivity: 'high',
      };

      audioScreenshotService.updateConfig(newConfig);
      const config = audioScreenshotService.getConfig();

      expect(config.sampleRate).toBe(48000);
      expect(config.echoCancellationSensitivity).toBe('high');
    });

    it('should get current configuration', () => {
      const config = audioScreenshotService.getConfig();

      expect(config).toEqual(AUDIO_CONFIGS.macos);
    });
  });

  describe('setupIpcHandlers', () => {
    it('should register all IPC handlers', () => {
      const { ipcMain } = require('electron');

      audioScreenshotService.setupIpcHandlers();

      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:check-permissions',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:request-microphone-permission',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:open-system-preferences',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:start-capture',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:stop-capture',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:capture-screenshot',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:get-platform',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:get-config',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'platform-audio:update-config',
        expect.any(Function)
      );
    });
  });

  describe('Utility Functions', () => {
    it('should convert stereo to mono correctly', () => {
      // Create a mock stereo buffer (2 channels, 16-bit)
      const stereoBuffer = Buffer.alloc(8); // 2 samples * 2 channels * 2 bytes
      stereoBuffer.writeInt16LE(100, 0); // Left channel sample 1
      stereoBuffer.writeInt16LE(200, 2); // Right channel sample 1
      stereoBuffer.writeInt16LE(150, 4); // Left channel sample 2
      stereoBuffer.writeInt16LE(250, 6); // Right channel sample 2

      // Access private method for testing
      const service = audioScreenshotService as any;
      const monoBuffer = service.convertStereoToMono(stereoBuffer);

      expect(monoBuffer.length).toBe(4); // 2 samples * 1 channel * 2 bytes
      
      // Check that samples are averaged correctly
      const sample1 = monoBuffer.readInt16LE(0);
      const sample2 = monoBuffer.readInt16LE(2);
      
      expect(sample1).toBe(150); // (100 + 200) / 2
      expect(sample2).toBe(200); // (150 + 250) / 2
    });
  });
}); 