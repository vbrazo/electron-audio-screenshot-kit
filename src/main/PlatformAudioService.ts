import { ipcMain, desktopCapturer, systemPreferences } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

import {
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
} from '../types';
import {
  PLATFORMS,
  AUDIO_CONFIGS,
  SCREENSHOT_CONFIGS,
  LOG_PREFIXES,
} from '../constants';

const execFileAsync = promisify(execFile);

// ============================================================================
// PLATFORM AUDIO SERVICE (MAIN PROCESS)
// ============================================================================

export class platformAudioScreenshotService {
  private isCapturing: boolean = false;
  private systemAudioProc: any = null;
  private audioChunks: AudioChunk[] = [];
  private screenshotInterval: NodeJS.Timeout | null = null;
  private config: AudioCaptureConfig;
  
  // Platform detection
  private readonly platform: Platform;
  private readonly isMacOS = process.platform === 'darwin';
  private readonly isWindows = process.platform === 'win32';
  private readonly isLinux = process.platform === 'linux';

  constructor(config?: Partial<AudioCaptureConfig>) {
    this.platform = this.detectPlatform();
    this.config = { ...AUDIO_CONFIGS[this.platform], ...config };
    
    console.log(`${LOG_PREFIXES.MAIN} platformAudioScreenshotService initialized for ${this.platform}`);
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  async checkSystemPermissions(): Promise<PermissionStatus> {
    try {
      console.log(`${LOG_PREFIXES.PERMISSION} Checking system permissions...`);
      
      let microphone: PermissionStatus['microphone'] = 'unknown';
      let screen: PermissionStatus['screen'] = 'unknown';
      let needsSetup = false;

      if (this.isMacOS) {
        // macOS specific permission checks
        try {
          const micStatus = systemPreferences.getMediaAccessStatus('microphone');
          microphone = micStatus as PermissionStatus['microphone'];
          
          // For screen recording, we need to trigger a capture request to register the app
          try {
            await desktopCapturer.getSources({ 
              types: ['screen'], 
              thumbnailSize: { width: 1, height: 1 } 
            });
            screen = 'granted';
          } catch (error) {
            screen = 'denied';
            needsSetup = true;
          }
        } catch (error) {
          console.error(`${LOG_PREFIXES.PERMISSION} Error checking macOS permissions:`, error);
          microphone = 'unknown';
          needsSetup = true;
        }
      } else if (this.isWindows) {
        // Windows uses standard browser permissions
        microphone = 'granted'; // Will be checked via getUserMedia
        screen = 'granted'; // Will be checked via getDisplayMedia
      } else if (this.isLinux) {
        // Linux uses standard browser permissions
        microphone = 'granted'; // Will be checked via getUserMedia
        screen = 'granted'; // Will be checked via getDisplayMedia
      }

      const status: PermissionStatus = {
        microphone,
        screen,
        needsSetup
      };

      console.log(`${LOG_PREFIXES.PERMISSION} Permission status:`, status);
      return status;
    } catch (error) {
      console.error(`${LOG_PREFIXES.PERMISSION} Error checking permissions:`, error);
      throw new PermissionError(
        error instanceof Error ? error.message : 'Unknown error',
        this.platform
      );
    }
  }

  async requestMicrophonePermission(): Promise<PermissionRequestResult> {
    if (!this.isMacOS) {
      return { success: true, status: 'granted' };
    }

    try {
      const status = systemPreferences.getMediaAccessStatus('microphone');
      console.log(`${LOG_PREFIXES.PERMISSION} Microphone status:`, status);
      
      if (status === 'granted') {
        return { success: true, status: 'granted' };
      }

      // Request microphone permission
      const granted = await systemPreferences.askForMediaAccess('microphone');
      return { 
        success: granted, 
        status: granted ? 'granted' : 'denied'
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.PERMISSION} Error requesting microphone permission:`, error);
      return { 
        success: false, 
        status: 'denied',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async openSystemPreferences(section: 'screen-recording' | 'microphone'): Promise<SystemPreferencesResult> {
    if (!this.isMacOS) {
      return { success: false, error: 'Not supported on this platform' };
    }

    try {
      if (section === 'screen-recording') {
        // First trigger screen capture request to register the app in system preferences
        try {
          console.log(`${LOG_PREFIXES.PERMISSION} Triggering screen capture request to register app...`);
          await desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: 1, height: 1 } 
          });
          console.log(`${LOG_PREFIXES.PERMISSION} App registered for screen recording`);
        } catch (captureError) {
          console.log(`${LOG_PREFIXES.PERMISSION} Screen capture request triggered (expected to fail):`, captureError);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error(`${LOG_PREFIXES.PERMISSION} Error opening system preferences:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async startAudioCapture(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isCapturing) {
        console.log(`${LOG_PREFIXES.AUDIO} Audio capture already running`);
        return { success: true };
      }

      console.log(`${LOG_PREFIXES.AUDIO} Starting platform-specific audio capture...`);
      
      // Check permissions first
      const permissions = await this.checkSystemPermissions();
      if (permissions.needsSetup) {
        throw new PermissionError(
          'System permissions need to be configured. Please check microphone and screen recording permissions.',
          this.platform
        );
      }

      this.isCapturing = true;
      this.audioChunks = [];

      if (this.isMacOS) {
        await this.startMacOSAudioCapture();
      } else if (this.isWindows) {
        await this.startWindowsAudioCapture();
      } else if (this.isLinux) {
        await this.startLinuxAudioCapture();
      }

      console.log(`${LOG_PREFIXES.AUDIO} Platform audio capture started successfully`);
      return { success: true };
    } catch (error) {
      console.error(`${LOG_PREFIXES.AUDIO} Failed to start audio capture:`, error);
      this.isCapturing = false;
      
      if (error instanceof PlatformAudioError) {
        throw error;
      }
      
      throw new AudioDeviceError(
        error instanceof Error ? error.message : 'Unknown error',
        this.platform
      );
    }
  }

  async stopAudioCapture(): Promise<{ success: boolean; audioChunks?: AudioChunk[] }> {
    try {
      if (!this.isCapturing) {
        return { success: true };
      }

      console.log(`${LOG_PREFIXES.AUDIO} Stopping platform audio capture...`);

      // Stop platform-specific capture
      if (this.isMacOS) {
        await this.stopMacOSAudioCapture();
      } else if (this.isWindows) {
        await this.stopWindowsAudioCapture();
      } else if (this.isLinux) {
        await this.stopLinuxAudioCapture();
      }

      // Stop screenshot capture
      if (this.screenshotInterval) {
        clearInterval(this.screenshotInterval);
        this.screenshotInterval = null;
      }

      this.isCapturing = false;
      const capturedChunks = [...this.audioChunks];
      this.audioChunks = [];

      console.log(`${LOG_PREFIXES.AUDIO} Platform audio capture stopped`);
      return { success: true, audioChunks: capturedChunks };
    } catch (error) {
      console.error(`${LOG_PREFIXES.AUDIO} Failed to stop audio capture:`, error);
      this.isCapturing = false;
      return { success: false };
    }
  }

  async captureScreenshot(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    try {
      if (this.isMacOS) {
        return await this.captureMacOSScreenshot(options);
      } else {
        return await this.captureCrossPlatformScreenshot(options);
      }
    } catch (error) {
      console.error(`${LOG_PREFIXES.SCREENSHOT} Failed to capture screenshot:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getPlatform(): Platform {
    return this.platform;
  }

  getConfig(): AudioCaptureConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AudioCaptureConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`${LOG_PREFIXES.AUDIO} Configuration updated:`, this.config);
  }

  // ============================================================================
  // PRIVATE METHODS - PLATFORM-SPECIFIC AUDIO CAPTURE
  // ============================================================================

  private async startMacOSAudioCapture(): Promise<void> {
    console.log(`${LOG_PREFIXES.AUDIO} Starting macOS audio capture...`);
    
    // Kill any existing SystemAudioDump processes
    await this.killExistingSystemAudioDump();
    
    // Start SystemAudioDump for system audio capture
    const { app } = require('electron');
    const systemAudioPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'SystemAudioDump')
      : path.join(__dirname, '..', '..', 'assets', 'SystemAudioDump');

    console.log(`${LOG_PREFIXES.AUDIO} SystemAudioDump path:`, systemAudioPath);

    // Check if binary exists
    if (!fs.existsSync(systemAudioPath)) {
      throw new SystemAudioError(
        `SystemAudioDump binary not found at ${systemAudioPath}`,
        this.platform
      );
    }

    this.systemAudioProc = spawn(systemAudioPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (!this.systemAudioProc.pid) {
      throw new SystemAudioError('Failed to start SystemAudioDump', this.platform);
    }

    console.log(`${LOG_PREFIXES.AUDIO} SystemAudioDump started with PID:`, this.systemAudioProc.pid);

    // Set up audio processing
    const CHUNK_DURATION = this.config.chunkDuration;
    const SAMPLE_RATE = this.config.sampleRate;
    const BYTES_PER_SAMPLE = this.config.bitsPerSample / 8;
    const CHANNELS = this.config.channels;
    const CHUNK_SIZE = SAMPLE_RATE * BYTES_PER_SAMPLE * CHANNELS * CHUNK_DURATION;

    let audioBuffer = Buffer.alloc(0);

    this.systemAudioProc.stdout.on('data', async (data: Buffer) => {
      audioBuffer = Buffer.concat([audioBuffer, data]);

      while (audioBuffer.length >= CHUNK_SIZE) {
        const chunk = audioBuffer.slice(0, CHUNK_SIZE);
        audioBuffer = audioBuffer.slice(CHUNK_SIZE);

        const monoChunk = CHANNELS === 2 ? this.convertStereoToMono(chunk) : chunk;
        const base64Data = monoChunk.toString('base64');

        this.audioChunks.push({
          data: base64Data,
          timestamp: Date.now(),
          source: 'system',
          mimeType: 'audio/pcm;rate=24000',
          duration: CHUNK_DURATION * 1000,
          sampleRate: SAMPLE_RATE,
        });
      }
    });

    this.systemAudioProc.stderr.on('data', (data: Buffer) => {
      console.error(`${LOG_PREFIXES.AUDIO} SystemAudioDump stderr:`, data.toString());
    });

    this.systemAudioProc.on('close', (code: number) => {
      console.log(`${LOG_PREFIXES.AUDIO} SystemAudioDump process closed with code:`, code);
      this.systemAudioProc = null;
    });

    this.systemAudioProc.on('error', (err: Error) => {
      console.error(`${LOG_PREFIXES.AUDIO} SystemAudioDump process error:`, err);
      this.systemAudioProc = null;
    });
  }

  private async startWindowsAudioCapture(): Promise<void> {
    console.log(`${LOG_PREFIXES.AUDIO} Starting Windows audio capture...`);
    
    // Windows audio capture is handled in the renderer process
    // The main process coordinates the capture
    console.log(`${LOG_PREFIXES.AUDIO} Windows audio capture will be handled in renderer process`);
  }

  private async startLinuxAudioCapture(): Promise<void> {
    console.log(`${LOG_PREFIXES.AUDIO} Starting Linux audio capture...`);
    
    // Linux audio capture is handled in the renderer process
    // Limited system audio support on Linux
    console.log(`${LOG_PREFIXES.AUDIO} Linux audio capture will be handled in renderer process`);
  }

  private async stopMacOSAudioCapture(): Promise<void> {
    if (this.systemAudioProc) {
      console.log(`${LOG_PREFIXES.AUDIO} Stopping SystemAudioDump...`);
      this.systemAudioProc.kill('SIGTERM');
      this.systemAudioProc = null;
    }
  }

  private async stopWindowsAudioCapture(): Promise<void> {
    console.log(`${LOG_PREFIXES.AUDIO} Stopping Windows audio capture...`);
    // Cleanup handled in renderer
  }

  private async stopLinuxAudioCapture(): Promise<void> {
    console.log(`${LOG_PREFIXES.AUDIO} Stopping Linux audio capture...`);
    // Cleanup handled in renderer
  }

  private async killExistingSystemAudioDump(): Promise<void> {
    return new Promise((resolve) => {
      console.log(`${LOG_PREFIXES.AUDIO} Checking for existing SystemAudioDump processes...`);

      const killProc = spawn('pkill', ['-f', 'SystemAudioDump'], {
        stdio: 'ignore',
      });

      killProc.on('close', (code: number) => {
        if (code === 0) {
          console.log(`${LOG_PREFIXES.AUDIO} Killed existing SystemAudioDump processes`);
        } else {
          console.log(`${LOG_PREFIXES.AUDIO} No existing SystemAudioDump processes found`);
        }
        resolve();
      });

      killProc.on('error', (err: Error) => {
        console.log(`${LOG_PREFIXES.AUDIO} Error checking for existing processes (this is normal):`, err.message);
        resolve();
      });

      setTimeout(() => {
        killProc.kill();
        resolve();
      }, 2000);
    });
  }

  // ============================================================================
  // PRIVATE METHODS - SCREENSHOT CAPTURE
  // ============================================================================

  private async captureMacOSScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
      const tempPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.jpg`);
      const quality = options.quality || 'medium';
      const config = SCREENSHOT_CONFIGS[quality];
      
      await execFileAsync('screencapture', ['-x', '-t', 'jpg', tempPath]);
      const imageBuffer = await fs.promises.readFile(tempPath);
      await fs.promises.unlink(tempPath);

      // Resize image for efficiency
      const sharp = require('sharp');
      const resizedBuffer = await sharp(imageBuffer)
        .resize({ height: config.height })
        .jpeg({ quality: config.jpegQuality })
        .toBuffer();

      const base64 = resizedBuffer.toString('base64');
      const metadata = await sharp(resizedBuffer).metadata();

      return { 
        success: true, 
        base64, 
        width: metadata.width, 
        height: metadata.height 
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.SCREENSHOT} Failed to capture macOS screenshot:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async captureCrossPlatformScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
      const quality = options.quality || 'medium';
      const config = SCREENSHOT_CONFIGS[quality];

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 1920,
          height: 1080,
        },
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const source = sources[0];
      if (!source || !source.thumbnail) {
        throw new Error('No valid screen source/thumbnail available');
      }
      const buffer = source.thumbnail.toJPEG(config.jpegQuality);
      const base64 = buffer.toString('base64');
      const size = source.thumbnail.getSize();

      return {
        success: true,
        base64,
        width: size.width,
        height: size.height,
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.SCREENSHOT} Failed to capture cross-platform screenshot:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - UTILITY FUNCTIONS
  // ============================================================================

  private detectPlatform(): Platform {
    if (this.isMacOS) return PLATFORMS.MACOS;
    if (this.isWindows) return PLATFORMS.WINDOWS;
    if (this.isLinux) return PLATFORMS.LINUX;
    return PLATFORMS.WINDOWS; // fallback
  }

  private convertStereoToMono(buffer: Buffer): Buffer {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    const monoArray = new Int16Array(int16Array.length / 2);
    
    for (let i = 0; i < monoArray.length; i++) {
      const left = int16Array[i * 2] ?? 0;
      const right = int16Array[i * 2 + 1] ?? 0;
      monoArray[i] = Math.round((left + right) / 2);
    }
    
    return Buffer.from(monoArray.buffer);
  }

  // ============================================================================
  // IPC HANDLERS SETUP
  // ============================================================================

  setupIpcHandlers(): void {
    ipcMain.handle('platform-audio:check-permissions', async () => {
      return await this.checkSystemPermissions();
    });

    ipcMain.handle('platform-audio:request-microphone-permission', async () => {
      return await this.requestMicrophonePermission();
    });

    ipcMain.handle('platform-audio:open-system-preferences', async (_event, section) => {
      return await this.openSystemPreferences(section);
    });

    ipcMain.handle('platform-audio:start-capture', async () => {
      return await this.startAudioCapture();
    });

    ipcMain.handle('platform-audio:stop-capture', async () => {
      return await this.stopAudioCapture();
    });

    ipcMain.handle('platform-audio:capture-screenshot', async (_event, options) => {
      return await this.captureScreenshot(options);
    });

    ipcMain.handle('platform-audio:get-platform', () => {
      return this.getPlatform();
    });

    ipcMain.handle('platform-audio:get-config', () => {
      return this.getConfig();
    });

    ipcMain.handle('platform-audio:update-config', async (_event, newConfig) => {
      this.updateConfig(newConfig);
      return { success: true };
    });

    console.log(`${LOG_PREFIXES.MAIN} Platform audio service IPC handlers registered`);
  }
} 