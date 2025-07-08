import { AudioCaptureConfig, ScreenshotQuality, Platform } from '../types';

export const PLATFORMS = {
  MACOS: 'macos' as Platform,
  WINDOWS: 'windows' as Platform,
  LINUX: 'linux' as Platform,
} as const;

export const SCREENSHOT_QUALITIES = {
  LOW: 'low' as ScreenshotQuality,
  MEDIUM: 'medium' as ScreenshotQuality,
  HIGH: 'high' as ScreenshotQuality,
} as const;

export const AUDIO_CONFIGS: Record<Platform, AudioCaptureConfig> = {
  macos: {
    sampleRate: 24000,
    channels: 1,
    bitsPerSample: 16,
    chunkDuration: 0.1,
    enableEchoCancellation: true,
    echoCancellationSensitivity: 'medium',
    bufferSize: 4096,
  },
  windows: {
    sampleRate: 24000,
    channels: 1,
    bitsPerSample: 16,
    chunkDuration: 0.1,
    enableEchoCancellation: true,
    echoCancellationSensitivity: 'medium',
    bufferSize: 4096,
  },
  linux: {
    sampleRate: 24000,
    channels: 1,
    bitsPerSample: 16,
    chunkDuration: 0.1,
    enableEchoCancellation: false, // Limited support on Linux
    echoCancellationSensitivity: 'low',
    bufferSize: 4096,
  },
};

export const SCREENSHOT_CONFIGS = {
  low: {
    jpegQuality: 60,
    height: 384,
    format: 'jpeg' as const,
  },
  medium: {
    jpegQuality: 80,
    height: 384,
    format: 'jpeg' as const,
  },
  high: {
    jpegQuality: 90,
    height: 384,
    format: 'jpeg' as const,
  },
};

export const PERMISSION_STATUSES = {
  GRANTED: 'granted',
  DENIED: 'denied',
  NOT_DETERMINED: 'not-determined',
  RESTRICTED: 'restricted',
  UNKNOWN: 'unknown',
} as const;

export const ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  AUDIO_DEVICE_ERROR: 'AUDIO_DEVICE_ERROR',
  SYSTEM_AUDIO_ERROR: 'SYSTEM_AUDIO_ERROR',
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED',
  BINARY_NOT_FOUND: 'BINARY_NOT_FOUND',
  AUDIO_CAPTURE_FAILED: 'AUDIO_CAPTURE_FAILED',
  SCREENSHOT_CAPTURE_FAILED: 'SCREENSHOT_CAPTURE_FAILED',
} as const;

export const MIME_TYPES = {
  AUDIO_PCM: 'audio/pcm;rate=24000',
  AUDIO_WAV: 'audio/wav',
  AUDIO_WEBM: 'audio/webm;codecs=opus',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
} as const;

export const FILE_EXTENSIONS = {
  AUDIO: {
    WAV: '.wav',
    MP3: '.mp3',
    OGG: '.ogg',
    WEBM: '.webm',
  },
  IMAGE: {
    JPEG: '.jpg',
    PNG: '.png',
  },
} as const;

export const DEFAULT_TIMEOUTS = {
  PERMISSION_REQUEST: 30000,
  AUDIO_CAPTURE_START: 10000,
  SCREENSHOT_CAPTURE: 5000,
  BINARY_EXECUTION: 15000,
} as const;

export const CHUNK_SIZES = {
  AUDIO: {
    SMALL: 1024,
    MEDIUM: 4096,
    LARGE: 8192,
  },
  SCREENSHOT: {
    THUMBNAIL: 150,
    PREVIEW: 384,
    FULL: 1080,
  },
} as const;

export const ECHO_CANCELLATION = {
  SENSITIVITY: {
    LOW: {
      threshold: 0.1,
      delay: 50,
      gain: 0.3,
    },
    MEDIUM: {
      threshold: 0.05,
      delay: 100,
      gain: 0.5,
    },
    HIGH: {
      threshold: 0.02,
      delay: 150,
      gain: 0.7,
    },
  },
  BUFFER_SIZE: 10,
  MAX_DELAY: 500,
} as const;

export const PLATFORM_CAPABILITIES = {
  macos: {
    systemAudio: true,
    echoCancellation: true,
    nativeScreenshots: true,
    permissionModel: 'system' as const,
    binarySupport: true,
  },
  windows: {
    systemAudio: true,
    echoCancellation: true,
    nativeScreenshots: false,
    permissionModel: 'browser' as const,
    binarySupport: false,
  },
  linux: {
    systemAudio: false,
    echoCancellation: false,
    nativeScreenshots: false,
    permissionModel: 'browser' as const,
    binarySupport: false,
  },
} as const;

export const BINARY_PATHS = {
  macos: {
    systemAudioDump: 'assets/SystemAudioDump',
    sox: '/usr/local/bin/sox',
  },
  windows: {
    sox: 'C:\\Program Files (x86)\\Sox\\sox.exe',
  },
  linux: {
    sox: '/usr/bin/sox',
  },
} as const;

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const;

export const LOG_PREFIXES = {
  MAIN: '[Main]',
  RENDERER: '[Renderer]',
  AUDIO: '[Audio]',
  PERMISSION: '[Permission]',
  SCREENSHOT: '[Screenshot]',
  PLATFORM: '[Platform]',
} as const;
