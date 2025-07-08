import { audioScreenshotService } from '../main/audioScreenshotService';
import { AudioCaptureConfig } from '../types';
import { AUDIO_CONFIGS, PLATFORMS } from '../constants';

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  desktopCapturer: {
    getSources: jest.fn((_options) => [
      {
        id: 'screen:0',
        name: 'Screen 1',
        thumbnail: {
          toJPEG: jest.fn(() => Buffer.from('mock-jpeg')),
          getSize: jest.fn(() => ({ width: 1920, height: 1080 })),
        },
      },
    ]),
  },
  systemPreferences: {
    getMediaAccessStatus: jest.fn(),
    askForMediaAccess: jest.fn(),
  },
  app: {
    whenReady: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
    isPackaged: false,
  },
}));

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

jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  }));
});

describe('audioScreenshotService', () => {
  let service: audioScreenshotService;
  let mockSpawn: jest.Mocked<any>;
  let mockFs: jest.Mocked<any>;
  let mockExecFile: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSpawn = require('child_process').spawn;
    mockFs = require('fs');
    mockExecFile = require('child_process').execFile;

    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
    });

    service = new audioScreenshotService();
  });

  describe('Constructor', () => {
    it('should initialize with default config for macOS', () => {
      expect(service.getPlatform()).toBe(PLATFORMS.MACOS);
      expect(service.getConfig()).toEqual(AUDIO_CONFIGS.macos);
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<AudioCaptureConfig> = {
        sampleRate: 48000,
        chunkDuration: 0.05,
      };

      const customService = new audioScreenshotService(customConfig);
      const config = customService.getConfig();

      expect(config.sampleRate).toBe(48000);
      expect(config.chunkDuration).toBe(0.05);
      expect(config.channels).toBe(AUDIO_CONFIGS.macos.channels);
    });

    it('should detect Windows platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const winService = new audioScreenshotService();
      expect(winService.getPlatform()).toBe(PLATFORMS.WINDOWS);
    });

    it('should detect Linux platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const linuxService = new audioScreenshotService();
      expect(linuxService.getPlatform()).toBe(PLATFORMS.LINUX);
    });
  });

  describe('checkSystemPermissions', () => {
    it('should check macOS permissions correctly', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);

      const result = await service.checkSystemPermissions();

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

      const result = await service.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'denied',
        screen: 'denied',
        needsSetup: true,
      });
    });

    it('should handle Windows permissions', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const winService = new audioScreenshotService();

      const result = await winService.checkSystemPermissions();

      expect(result).toEqual({
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      });
    });

    it('should handle Linux permissions', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const linuxService = new audioScreenshotService();

      const result = await linuxService.checkSystemPermissions();

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
      const winService = new audioScreenshotService();

      const result = await winService.requestMicrophonePermission();

      expect(result).toEqual({
        success: true,
        status: 'granted',
      });
    });

    it('should request microphone permission on macOS', async () => {
      const { systemPreferences } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('not-determined');
      systemPreferences.askForMediaAccess.mockResolvedValue(true);

      const result = await service.requestMicrophonePermission();

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

      const result = await service.requestMicrophonePermission();

      expect(result).toEqual({
        success: false,
        status: 'denied',
      });
    });
  });

  describe('openSystemPreferences', () => {
    it('should return error for non-macOS platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const winService = new audioScreenshotService();

      const result = await winService.openSystemPreferences('screen-recording');

      expect(result).toEqual({
        success: false,
        error: 'Not supported on this platform',
      });
    });

    it('should trigger screen capture request on macOS', async () => {
      const { desktopCapturer } = require('electron');
      
      desktopCapturer.getSources.mockRejectedValue(new Error('Expected failure'));

      const result = await service.openSystemPreferences('screen-recording');

      expect(result).toEqual({
        success: true,
      });
      expect(desktopCapturer.getSources).toHaveBeenCalled();
    });
  });

  describe('startAudioCapture', () => {
    it('should start macOS audio capture', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(true);
      
      const mockProcess = {
        kill: jest.fn(),
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        pid: 12345,
      };
      mockSpawn.mockReturnValue(mockProcess);

      const result = await service.startAudioCapture();

      expect(result).toEqual({ success: true });
    }, 15000);

    it('should handle missing SystemAudioDump binary', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(false);

      await expect(service.startAudioCapture()).rejects.toThrow(
        'SystemAudioDump binary not found'
      );
    }, 15000);

    it('should handle permission errors', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('denied');
      desktopCapturer.getSources.mockRejectedValue(new Error('Permission denied'));

      await expect(service.startAudioCapture()).rejects.toThrow(
        'System permissions need to be configured'
      );
    });

    it('should start Windows audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const winService = new audioScreenshotService();

      const result = await winService.startAudioCapture();

      expect(result).toEqual({ success: true });
    });

    it('should start Linux audio capture', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const linuxService = new audioScreenshotService();

      const result = await linuxService.startAudioCapture();

      expect(result).toEqual({ success: true });
    });
  });

  describe('stopAudioCapture', () => {
    it('should stop macOS audio capture', async () => {
      const { systemPreferences, desktopCapturer } = require('electron');
      
      systemPreferences.getMediaAccessStatus.mockReturnValue('granted');
      desktopCapturer.getSources.mockResolvedValue([{ id: 'screen:0' }]);
      mockFs.existsSync.mockReturnValue(true);
      
      const mockProcess = {
        kill: jest.fn(),
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        pid: 12345,
      };
      mockSpawn.mockReturnValue(mockProcess);

      await service.startAudioCapture();
      const result = await service.stopAudioCapture();

      expect(result.success).toBe(true);
    });

    it('should return success when not capturing', async () => {
      const result = await service.stopAudioCapture();

      expect(result).toEqual({ success: true });
    });
  });

  describe('captureScreenshot', () => {
    it('should capture macOS screenshot', async () => {
      mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
      mockFs.promises.readFile.mockResolvedValue(Buffer.from('mock-screenshot'));

      const result = await service.captureScreenshot({ quality: 'high' });

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
    });

    it('should capture cross-platform screenshot', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const winService = new audioScreenshotService();
      
      const { desktopCapturer } = require('electron');
      desktopCapturer.getSources.mockResolvedValue([
        {
          id: 'screen:0',
          name: 'Screen 1',
          thumbnail: {
            toJPEG: jest.fn(() => Buffer.from('mock-jpeg')),
            getSize: jest.fn(() => ({ width: 1920, height: 1080 })),
          },
        },
      ]);

      const result = await winService.captureScreenshot({ quality: 'medium' });

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
    });

    it('should handle screenshot capture errors', async () => {
      mockExecFile.mockRejectedValue(new Error('Screenshot failed'));

      const result = await service.captureScreenshot();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<AudioCaptureConfig> = {
        sampleRate: 48000,
        chunkDuration: 0.05,
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.sampleRate).toBe(48000);
      expect(config.chunkDuration).toBe(0.05);
    });

    it('should get current configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual(AUDIO_CONFIGS.macos);
    });
  });

  describe('setupIpcHandlers', () => {
    it('should register all IPC handlers', () => {
      const { ipcMain } = require('electron');

      service.setupIpcHandlers();

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
});
