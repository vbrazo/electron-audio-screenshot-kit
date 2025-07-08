// ============================================================================
// ELECTRON PLATFORM AUDIO - TYPES AND INTERFACES
// ============================================================================

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  chunkDuration: number;
  enableEchoCancellation: boolean;
  echoCancellationSensitivity: 'low' | 'medium' | 'high';
  bufferSize: number;
}

export interface AudioChunk {
  data: string; // base64 encoded
  timestamp: number;
  source: 'microphone' | 'system';
  mimeType: string;
  duration: number;
  sampleRate: number;
}

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown';
  screen: 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown';
  needsSetup: boolean;
  error?: string;
}

export interface ScreenshotOptions {
  quality?: 'low' | 'medium' | 'high';
  format?: 'jpeg' | 'png';
  width?: number;
  height?: number;
}

export interface ScreenshotResult {
  success: boolean;
  base64?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface AudioCaptureState {
  isRecording: boolean;
  isMicActive: boolean;
  isSystemAudioActive: boolean;
  recordingDuration: number;
  error: string | null;
  platform: 'macos' | 'windows' | 'linux';
  audioChunksCount: number;
  lastChunkTimestamp: number;
}

export interface AudioCaptureResult {
  success: boolean;
  audioChunks?: AudioChunk[];
  error?: string;
  duration?: number;
  totalChunks?: number;
}

export interface PermissionRequestResult {
  success: boolean;
  status: string;
  error?: string;
}

export interface SystemPreferencesResult {
  success: boolean;
  error?: string;
}

export interface AudioProcessingOptions {
  enableEchoCancellation: boolean;
  echoCancellationSensitivity: 'low' | 'medium' | 'high';
  noiseSuppression: boolean;
  autoGainControl: boolean;
  echoCancellation: boolean;
}

export interface PlatformInfo {
  platform: 'macos' | 'windows' | 'linux';
  version: string;
  arch: string;
  supportsSystemAudio: boolean;
  supportsEchoCancellation: boolean;
  permissionModel: 'system' | 'browser' | 'hybrid';
}

export interface AudioDevice {
  id: string;
  name: string;
  type: 'microphone' | 'speaker' | 'system';
  sampleRate: number;
  channels: number;
  isDefault: boolean;
}

export interface AudioCaptureEvent {
  type: 'start' | 'stop' | 'chunk' | 'error' | 'permission';
  data?: any;
  timestamp: number;
}

export interface AudioCaptureCallbacks {
  onStart?: () => void;
  onStop?: (result: AudioCaptureResult) => void;
  onChunk?: (chunk: AudioChunk) => void;
  onError?: (error: string) => void;
  onPermissionChange?: (status: PermissionStatus) => void;
  onStateChange?: (state: AudioCaptureState) => void;
}

// ============================================================================
// PLATFORM-SPECIFIC TYPES
// ============================================================================

export interface MacOSAudioConfig extends AudioCaptureConfig {
  systemAudioDumpPath?: string;
  useCoreAudio: boolean;
}

export interface WindowsAudioConfig extends AudioCaptureConfig {
  useWASAPI: boolean;
  loopbackMode: 'default' | 'exclusive' | 'shared';
}

export interface LinuxAudioConfig extends AudioCaptureConfig {
  usePulseAudio: boolean;
  useALSA: boolean;
  soxPath?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Platform = 'macos' | 'windows' | 'linux';
export type ScreenshotQuality = 'low' | 'medium' | 'high';
export type EchoCancellationSensitivity = 'low' | 'medium' | 'high';
export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm';
export type PermissionType = 'microphone' | 'screen' | 'both';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class PlatformAudioError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform?: Platform,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformAudioError';
  }
}

export class PermissionError extends PlatformAudioError {
  constructor(message: string, platform?: Platform) {
    super(message, 'PERMISSION_DENIED', platform);
    this.name = 'PermissionError';
  }
}

export class AudioDeviceError extends PlatformAudioError {
  constructor(message: string, platform?: Platform) {
    super(message, 'AUDIO_DEVICE_ERROR', platform);
    this.name = 'AudioDeviceError';
  }
}

export class SystemAudioError extends PlatformAudioError {
  constructor(message: string, platform?: Platform) {
    super(message, 'SYSTEM_AUDIO_ERROR', platform);
    this.name = 'SystemAudioError';
  }
} 