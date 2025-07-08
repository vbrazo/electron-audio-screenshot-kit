// =========================================================================
// ELECTRON PLATFORM AUDIO - MAIN EXPORTS
// =========================================================================

// Main process service
export { audioScreenshotService } from './main/audioScreenshotService';

// Types and interfaces
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

// Constants
export { PLATFORMS, AUDIO_CONFIGS, SCREENSHOT_CONFIGS, LOG_PREFIXES } from './constants';

// Main process default export
export { audioScreenshotService as default } from './main/audioScreenshotService'; 