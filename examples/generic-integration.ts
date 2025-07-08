// ============================================================================
// GENERIC ELECTRON APP INTEGRATION EXAMPLE
// ============================================================================
// This example shows how to integrate electron-audio-shot into any Electron app

import { audioScreenshotService } from 'electron-audio-shot';
import { app, ipcMain } from 'electron';

// ============================================================================
// MAIN PROCESS INTEGRATION
// ============================================================================

class GenericAudioIntegration {
  private audioScreenshotService: audioScreenshotService;

  constructor() {
    // Initialize with your app's configuration
    this.audioScreenshotService = new audioScreenshotService({
      sampleRate: 24000,
      chunkDuration: 0.1,
      enableEchoCancellation: true,
      echoCancellationSensitivity: 'medium',
    });

    this.setupIpcHandlers();
    this.setupAppSpecificHandlers();
  }

  private setupIpcHandlers(): void {
    // Register standard platform audio handlers
    this.audioScreenshotService.setupIpcHandlers();
  }

  private setupAppSpecificHandlers(): void {
    // Your app-specific audio handling
    ipcMain.handle('app:start-audio-recording', async () => {
      try {
        const result = await this.audioScreenshotService.startAudioCapture();
        return result;
      } catch (error) {
        console.error('Failed to start audio recording:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('app:stop-audio-recording', async () => {
      try {
        const result = await this.audioScreenshotService.stopAudioCapture();
        return result;
      } catch (error) {
        console.error('Failed to stop audio recording:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('app:capture-screenshot', async (event, options) => {
      try {
        const result = await this.audioScreenshotService.captureScreenshot(options);
        return result;
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }
}

// ============================================================================
// RENDERER PROCESS INTEGRATION
// ============================================================================

import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-audio-shot';

// Generic audio capture class (for non-React apps)
export class GenericAudioCapture {
  private audioCapture: PlatformAudioCapture;
  private isRecording: boolean = false;
  private audioChunks: any[] = [];
  private error: string | null = null;

  constructor() {
    this.audioCapture = new PlatformAudioCapture();
  }

  async startRecording(): Promise<boolean> {
    try {
      this.error = null;
      const result = await this.audioCapture.startCapture(5, 'medium'); // 5s screenshot intervals
      
      if (result.success) {
        this.isRecording = true;
        console.log('Audio recording started');
        return true;
      } else {
        this.error = result.error || 'Failed to start recording';
        return false;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      return false;
    }
  }

  async stopRecording(): Promise<any[]> {
    try {
      const result = await this.audioCapture.stopCapture();
      
      if (result.success && result.audioChunks) {
        this.audioChunks = result.audioChunks;
        console.log(`Recording completed: ${result.audioChunks.length} chunks`);
        
        // Process the audio chunks as needed
        await this.processAudioChunks(result.audioChunks);
        return result.audioChunks;
      }
      
      this.isRecording = false;
      return [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      return [];
    }
  }

  private async processAudioChunks(chunks: any[]): Promise<void> {
    // Your app-specific audio processing logic
    try {
      console.log('Processing audio chunks:', chunks.length);
      
      // Example: Send to your API
      // const response = await fetch('/api/process-audio', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ audioChunks: chunks }),
      // });
      
      // Example: Save to file
      // await saveAudioToFile(chunks);
      
      // Example: Send to AI service
      // await sendToAIService(chunks);
      
    } catch (err) {
      console.error('Failed to process audio chunks:', err);
    }
  }

  getState() {
    return {
      isRecording: this.isRecording,
      audioChunks: this.audioChunks,
      error: this.error,
      platform: this.audioCapture.getState().platform,
      recordingDuration: this.audioCapture.getState().recordingDuration,
    };
  }
}

// ============================================================================
// GENERIC MAIN PROCESS SETUP
// ============================================================================

// In your main.ts or main process file:
export function setupGenericAudioIntegration() {
  app.whenReady().then(() => {
    new GenericAudioIntegration();
  });
}

// ============================================================================
// GENERIC PACKAGE.JSON INTEGRATION
// ============================================================================

/*
Add to your package.json:

{
  "dependencies": {
    "electron-audio-shot": "^1.0.0",
    "sharp": "^0.34.2"
  },
  "peerDependencies": {
    "electron": "^20.0.0"
  }
}
*/

// ============================================================================
// GENERIC USAGE EXAMPLES
// ============================================================================

// Example 1: Basic usage in a vanilla JavaScript/TypeScript app
export function basicUsageExample() {
  const audioCapture = new GenericAudioCapture();
  
  // Start recording
  audioCapture.startRecording().then(success => {
    if (success) {
      console.log('Recording started successfully');
    } else {
      console.error('Failed to start recording');
    }
  });
  
  // Stop recording after some time
  setTimeout(async () => {
    const chunks = await audioCapture.stopRecording();
    console.log('Recording stopped, got chunks:', chunks.length);
  }, 10000); // Stop after 10 seconds
}

// Example 2: React component usage (create a separate .tsx file)
/*
// In your React component file (e.g., AudioRecorder.tsx):
import React, { useState, useEffect } from 'react';
import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-audio-shot';

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [audioChunks, setAudioChunks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioCapture = new PlatformAudioCapture();

  const startRecording = async () => {
    try {
      setError(null);
      const result = await audioCapture.startCapture(5, 'medium');
      
      if (result.success) {
        setIsRecording(true);
        console.log('Audio recording started');
      } else {
        setError(result.error || 'Failed to start recording');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioCapture.stopCapture();
      
      if (result.success && result.audioChunks) {
        setAudioChunks(result.audioChunks);
        console.log(`Recording completed: ${result.audioChunks.length} chunks`);
      }
      
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (!permissionsReady) {
    return (
      <PlatformPermissionChecker
        onPermissionsReady={() => setPermissionsReady(true)}
        onPermissionsError={(error) => setError(error)}
      />
    );
  }

  return (
    <div className="audio-recorder">
      <h3>Audio Recording</h3>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording} className="start-btn">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="stop-btn">
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-status">
          <div className="recording-indicator">● Recording...</div>
          <div className="recording-info">
            Platform: {audioCapture.getState().platform}
            <br />
            Duration: {Math.floor(audioCapture.getState().recordingDuration / 1000)}s
          </div>
        </div>
      )}

      {audioChunks.length > 0 && (
        <div className="recording-results">
          <h4>Recording Results</h4>
          <p>Captured {audioChunks.length} audio chunks</p>
        </div>
      )}
    </div>
  );
}
*/

// ============================================================================
// GENERIC API INTEGRATION
// ============================================================================

// Example of processing audio data with your app's logic
export async function processAudioWithYourApp(audioChunks: any[]) {
  try {
    // Example: Send to your API
    const response = await fetch('/api/process-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        audioChunks,
        metadata: {
          platform: 'electron',
          timestamp: Date.now(),
          duration: audioChunks.reduce((sum, chunk) => sum + chunk.duration, 0),
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process audio');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Audio processing failed:', error);
    throw error;
  }
}

function getAuthToken(): string {
  // Get authentication token from your auth system
  return localStorage.getItem('auth_token') || '';
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

// Example 1: Custom audio processing
export class CustomAudioProcessor {
  private audioCapture: PlatformAudioCapture;
  private isProcessing: boolean = false;

  constructor() {
    this.audioCapture = new PlatformAudioCapture();
  }

  async processAudio(chunks: any[]) {
    this.isProcessing = true;
    try {
      // Your custom processing logic
      const processedChunks = chunks.map(chunk => ({
        ...chunk,
        processed: true,
        timestamp: Date.now(),
      }));
      
      // Send to your processing pipeline
      await this.sendToProcessingPipeline(processedChunks);
      
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendToProcessingPipeline(chunks: any[]) {
    // Your processing pipeline logic
    console.log('Sending to processing pipeline:', chunks.length);
  }
}

// Example 2: Real-time audio streaming
export class RealTimeAudioStream {
  private audioCapture: PlatformAudioCapture;
  private streaming: boolean = false;

  constructor() {
    this.audioCapture = new PlatformAudioCapture();
  }

  async startStreaming() {
    this.streaming = true;
    
    // Start real-time streaming
    await this.audioCapture.startCapture(1, 'high'); // 1s intervals for real-time
    
    // Set up real-time processing
    this.audioCapture.onAudioChunk((chunk) => {
      // Process each chunk in real-time
      this.processRealTimeChunk(chunk);
    });
  }

  private processRealTimeChunk(chunk: any) {
    // Your real-time processing logic
    console.log('Processing real-time chunk:', chunk);
  }
}

// Example 3: Screenshot capture with audio
export class ScreenshotWithAudio {
  private audioCapture: PlatformAudioCapture;

  constructor() {
    this.audioCapture = new PlatformAudioCapture();
  }

  async captureWithScreenshot() {
    // Start recording with automatic screenshots
    await this.audioCapture.startCapture(10, 'medium'); // Screenshot every 10s
    
    // Manual screenshot capture
    const screenshot = await this.audioCapture.captureManualScreenshot('high');
    
    if (screenshot.success) {
      console.log('Screenshot captured:', screenshot.base64?.substring(0, 50) + '...');
    }
  }
} 