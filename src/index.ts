export { audioScreenshotService } from './main/audioScreenshotService';

export type {
  AudioCaptureConfig,
  AudioChunk,
  PermissionStatus,
  ScreenshotOptions,
  ScreenshotResult,
  PermissionRequestResult,
  SystemPreferencesResult,
  Platform,
  PlatformAudioError,
  PermissionError,
  AudioDeviceError,
  SystemAudioError,
} from './types';

export { PLATFORMS, AUDIO_CONFIGS, SCREENSHOT_CONFIGS, LOG_PREFIXES } from './constants';

export { audioScreenshotService as default } from './main/audioScreenshotService'; 