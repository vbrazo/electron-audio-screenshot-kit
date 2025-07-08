import { 
  AudioCaptureConfig, 
  AudioChunk, 
  PermissionStatus, 
  Platform,
  PlatformAudioError,
  PermissionError,
  AudioDeviceError,
  SystemAudioError
} from '../types';
import { AUDIO_CONFIGS, PLATFORMS } from '../constants';

describe('Types and Constants', () => {
  describe('AudioCaptureConfig', () => {
    it('should have correct structure', () => {
      const config: AudioCaptureConfig = {
        sampleRate: 24000,
        channels: 1,
        bitsPerSample: 16,
        chunkDuration: 0.1,
        enableEchoCancellation: true,
        echoCancellationSensitivity: 'medium',
        bufferSize: 4096,
      };

      expect(config.sampleRate).toBe(24000);
      expect(config.channels).toBe(1);
      expect(config.bitsPerSample).toBe(16);
      expect(config.chunkDuration).toBe(0.1);
      expect(config.enableEchoCancellation).toBe(true);
      expect(config.echoCancellationSensitivity).toBe('medium');
      expect(config.bufferSize).toBe(4096);
    });
  });

  describe('AudioChunk', () => {
    it('should have correct structure', () => {
      const chunk: AudioChunk = {
        data: 'base64-encoded-audio-data',
        timestamp: Date.now(),
        source: 'microphone',
        mimeType: 'audio/pcm;rate=24000',
        duration: 100,
        sampleRate: 24000,
      };

      expect(chunk.data).toBe('base64-encoded-audio-data');
      expect(chunk.source).toBe('microphone');
      expect(chunk.mimeType).toBe('audio/pcm;rate=24000');
      expect(chunk.duration).toBe(100);
      expect(chunk.sampleRate).toBe(24000);
    });
  });

  describe('PermissionStatus', () => {
    it('should have correct structure', () => {
      const status: PermissionStatus = {
        microphone: 'granted',
        screen: 'granted',
        needsSetup: false,
      };

      expect(status.microphone).toBe('granted');
      expect(status.screen).toBe('granted');
      expect(status.needsSetup).toBe(false);
    });
  });

  describe('Platform constants', () => {
    it('should have correct platform values', () => {
      expect(PLATFORMS.MACOS).toBe('macos');
      expect(PLATFORMS.WINDOWS).toBe('windows');
      expect(PLATFORMS.LINUX).toBe('linux');
    });
  });

  describe('Audio configurations', () => {
    it('should have configurations for all platforms', () => {
      expect(AUDIO_CONFIGS.macos).toBeDefined();
      expect(AUDIO_CONFIGS.windows).toBeDefined();
      expect(AUDIO_CONFIGS.linux).toBeDefined();
    });

    it('should have correct macOS configuration', () => {
      const macConfig = AUDIO_CONFIGS.macos;
      expect(macConfig.sampleRate).toBe(24000);
      expect(macConfig.enableEchoCancellation).toBe(true);
      expect(macConfig.echoCancellationSensitivity).toBe('medium');
    });

    it('should have correct Windows configuration', () => {
      const winConfig = AUDIO_CONFIGS.windows;
      expect(winConfig.sampleRate).toBe(24000);
      expect(winConfig.enableEchoCancellation).toBe(true);
      expect(winConfig.echoCancellationSensitivity).toBe('medium');
    });

    it('should have correct Linux configuration', () => {
      const linuxConfig = AUDIO_CONFIGS.linux;
      expect(linuxConfig.sampleRate).toBe(24000);
      expect(linuxConfig.enableEchoCancellation).toBe(false); // Limited support
      expect(linuxConfig.echoCancellationSensitivity).toBe('low');
    });
  });

  describe('Error classes', () => {
    it('should create PlatformAudioError correctly', () => {
      const error = new PlatformAudioError('Test error', 'TEST_ERROR', 'macos');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.platform).toBe('macos');
      expect(error.name).toBe('PlatformAudioError');
    });

    it('should create PermissionError correctly', () => {
      const error = new PermissionError('Permission denied', 'macos');
      
      expect(error.message).toBe('Permission denied');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.platform).toBe('macos');
      expect(error.name).toBe('PermissionError');
    });

    it('should create AudioDeviceError correctly', () => {
      const error = new AudioDeviceError('Device not found', 'windows');
      
      expect(error.message).toBe('Device not found');
      expect(error.code).toBe('AUDIO_DEVICE_ERROR');
      expect(error.platform).toBe('windows');
      expect(error.name).toBe('AudioDeviceError');
    });

    it('should create SystemAudioError correctly', () => {
      const error = new SystemAudioError('System audio failed', 'linux');
      
      expect(error.message).toBe('System audio failed');
      expect(error.code).toBe('SYSTEM_AUDIO_ERROR');
      expect(error.platform).toBe('linux');
      expect(error.name).toBe('SystemAudioError');
    });
  });
}); 