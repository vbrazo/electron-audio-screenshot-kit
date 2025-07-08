# electron-platform-audio-screenshot

A cross-platform audio capture library for Electron apps with platform-specific permission handling, echo cancellation, and screenshot capture capabilities.

## 🚀 Features

- **Cross-platform audio capture** (macOS, Windows, Linux)
- **Platform-specific permission handling** (System preferences on macOS, browser on others)
- **Echo cancellation** and audio processing
- **Screenshot capture** with quality options
- **TypeScript support** with full type definitions
- **React components** for easy integration
- **Comprehensive testing** and documentation

## 📋 Platform Support

| Feature | macOS | Windows | Linux |
|---------|-------|---------|-------|
| System Audio | ✅ Native | ✅ Loopback | ⚠️ Limited |
| Microphone | ✅ Native | ✅ Native | ✅ Native |
| Echo Cancellation | ✅ Advanced | ✅ Real-time | ⚠️ Basic |
| Screenshots | ✅ Native | ✅ Electron | ✅ Electron |
| Permissions | System Prefs | Browser | Browser |

## 🛠️ Installation

```bash
npm install electron-platform-audio-screenshot
```

### Peer Dependencies

This library requires Electron as a peer dependency:

```json
{
  "peerDependencies": {
    "electron": ">=20.0.0"
  }
}
```

## 🎯 Quick Start

### 1. Main Process Setup

```typescript
// main.ts
import { app, ipcMain } from 'electron';
import { platformAudioScreenshotService } from 'electron-platform-audio-screenshot';

class MyElectronApp {
  private platformAudioScreenshotService: platformAudioScreenshotService;

  constructor() {
    // Initialize with your app's configuration
    this.platformAudioScreenshotService = new platformAudioScreenshotService({
      sampleRate: 24000,
      chunkDuration: 0.1,
      enableEchoCancellation: true,
      echoCancellationSensitivity: 'medium',
    });

    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    // Register standard platform audio handlers
    this.platformAudioScreenshotService.setupIpcHandlers();
    
    // Your app-specific handlers
    ipcMain.handle('app:start-recording', async () => {
      return await this.platformAudioScreenshotService.startAudioCapture();
    });
  }
}

app.whenReady().then(() => {
  new MyElectronApp();
});
```

### 2. Renderer Process Setup

```typescript
// renderer.ts
import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-platform-audio-screenshot';

// Basic usage
const audioCapture = new PlatformAudioCapture();

// Start recording
const result = await audioCapture.startCapture(5, 'medium'); // 5s screenshot intervals
if (result.success) {
  console.log('Recording started');
}

// Stop recording
const stopResult = await audioCapture.stopCapture();
if (stopResult.success && stopResult.audioChunks) {
  console.log(`Captured ${stopResult.audioChunks.length} audio chunks`);
}
```

### 3. React Integration

```tsx
// AudioRecorder.tsx
import React, { useState } from 'react';
import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-platform-audio-screenshot';

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const audioCapture = new PlatformAudioCapture();

  const startRecording = async () => {
    const result = await audioCapture.startCapture(5, 'medium');
    if (result.success) {
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    const result = await audioCapture.stopCapture();
    if (result.success) {
      setIsRecording(false);
      // Process audio chunks
      console.log('Audio chunks:', result.audioChunks);
    }
  };

  if (!permissionsReady) {
    return (
      <PlatformPermissionChecker
        onPermissionsReady={() => setPermissionsReady(true)}
        onPermissionsError={(error) => console.error(error)}
      />
    );
  }

  return (
    <div>
      {!isRecording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
    </div>
  );
}
```

## 📚 API Reference

### platformAudioScreenshotService (Main Process)

The main service that handles audio capture and IPC communication.

#### Constructor

```typescript
new platformAudioScreenshotService(config: AudioConfig)
```

#### Configuration

```typescript
interface AudioConfig {
  sampleRate?: number;                    // Default: 24000
  chunkDuration?: number;                 // Default: 0.1 (seconds)
  enableEchoCancellation?: boolean;       // Default: true
  echoCancellationSensitivity?: 'low' | 'medium' | 'high'; // Default: 'medium'
  screenshotInterval?: number;            // Default: 5 (seconds)
  screenshotQuality?: 'low' | 'medium' | 'high'; // Default: 'medium'
}
```

#### Methods

```typescript
// Setup IPC handlers for renderer communication
setupIpcHandlers(): void

// Start audio capture
startAudioCapture(): Promise<AudioResult>

// Stop audio capture
stopAudioCapture(): Promise<AudioResult>

// Capture screenshot manually
captureScreenshot(options?: ScreenshotOptions): Promise<ScreenshotResult>

// Get current platform
getPlatform(): Platform

// Get current configuration
getConfig(): AudioConfig

// Update configuration
updateConfig(config: Partial<AudioConfig>): void
```

### PlatformAudioCapture (Renderer Process)

The renderer process service for audio capture.

#### Constructor

```typescript
new PlatformAudioCapture()
```

#### Methods

```typescript
// Start audio capture
startCapture(screenshotInterval?: number, quality?: 'low' | 'medium' | 'high'): Promise<AudioResult>

// Stop audio capture
stopCapture(): Promise<AudioResult>

// Capture screenshot manually
captureManualScreenshot(quality?: 'low' | 'medium' | 'high'): Promise<ScreenshotResult>

// Get current state
getState(): AudioState

// Listen for audio chunks (real-time)
onAudioChunk(callback: (chunk: AudioChunk) => void): void
```

### React Components

#### PlatformPermissionChecker

Handles platform-specific permission requests.

```tsx
<PlatformPermissionChecker
  onPermissionsReady={() => console.log('Ready')}
  onPermissionsError={(error) => console.error(error)}
/>
```

#### AudioCaptureUI

Pre-built UI component for audio capture.

```tsx
<AudioCaptureUI
  onRecordingComplete={(chunks) => console.log('Complete:', chunks)}
  onError={(error) => console.error('Error:', error)}
/>
```

## 🔧 Advanced Usage

### Custom Audio Processing

```typescript
class CustomAudioProcessor {
  private audioCapture: PlatformAudioCapture;

  constructor() {
    this.audioCapture = new PlatformAudioCapture();
  }

  async processAudio(chunks: AudioChunk[]) {
    // Your custom processing logic
    const processedChunks = chunks.map(chunk => ({
      ...chunk,
      processed: true,
      timestamp: Date.now(),
    }));
    
    // Send to your processing pipeline
    await this.sendToProcessingPipeline(processedChunks);
  }

  private async sendToProcessingPipeline(chunks: AudioChunk[]) {
    // Your processing pipeline logic
    console.log('Processing chunks:', chunks.length);
  }
}
```

### Real-time Audio Streaming

```typescript
class RealTimeAudioStream {
  private audioCapture: PlatformAudioCapture;

  async startStreaming() {
    // Start real-time streaming
    await this.audioCapture.startCapture(1, 'high'); // 1s intervals
    
    // Set up real-time processing
    this.audioCapture.onAudioChunk((chunk) => {
      // Process each chunk in real-time
      this.processRealTimeChunk(chunk);
    });
  }

  private processRealTimeChunk(chunk: AudioChunk) {
    // Your real-time processing logic
    console.log('Processing chunk:', chunk);
  }
}
```

### Screenshot with Audio

```typescript
class ScreenshotWithAudio {
  private audioCapture: PlatformAudioCapture;

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
```

## 🧪 Testing

### Run Basic Tests

```bash
npm run test:basic
```

### Run Integration Tests

```bash
npm run test:integration
```

### Test on Different Platforms

#### macOS Testing
```bash
# Test system audio capture
npm run test:integration

# Test permissions
# 1. Run the app
# 2. Check System Preferences → Security & Privacy → Privacy
# 3. Verify microphone and screen recording permissions
```

#### Windows Testing
```bash
# Test loopback audio
# 1. Play some audio on the system
# 2. Start recording in the app
# 3. Verify both system audio and microphone are captured
```

#### Linux Testing
```bash
# Test basic functionality
# 1. Install sox: sudo apt-get install sox
# 2. Test microphone capture
# 3. Note: System audio has limited support
```

## 🔍 Troubleshooting

### Common Issues

#### "Module not found" Error
```bash
# Ensure the library is installed
npm install electron-platform-audio-screenshot

# Check if it's in node_modules
ls node_modules/electron-platform-audio-screenshot
```

#### Permission Issues on macOS
```bash
# Check System Preferences
# System Preferences → Security & Privacy → Privacy
# Add your app to Microphone and Screen Recording lists
```

#### Audio Not Capturing
```bash
# Check if audio devices are working
# Test with system audio playing
# Verify microphone permissions
```

#### Screenshot Issues
```bash
# On macOS: Check screen recording permissions
# On Windows/Linux: Check browser permissions
```

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.DEBUG = 'electron-platform-audio-screenshot:*';

// Or enable in your app
console.log('Platform:', audioService.getPlatform());
console.log('Config:', audioService.getConfig());
```

## 📊 Performance

### Audio Quality

- **Sample Rate**: 24kHz (configurable)
- **Chunk Duration**: 100ms (configurable)
- **Echo Cancellation**: Real-time processing
- **Latency**: <50ms on most systems

### Screenshot Quality

- **Low**: 800x600, ~100KB
- **Medium**: 1920x1080, ~300KB
- **High**: Native resolution, ~1MB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Setup

```bash
git clone https://github.com/electron-platform-audio-screenshot/electron-platform-audio-screenshot.git
cd electron-platform-audio-screenshot
npm install
npm run build
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/electron-platform-audio-screenshot/electron-platform-audio-screenshot/wiki)
- **Issues**: [GitHub Issues](https://github.com/electron-platform-audio-screenshot/electron-platform-audio-screenshot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/electron-platform-audio-screenshot/electron-platform-audio-screenshot/discussions)

## 🎯 Examples

See the [examples](./examples/) directory for complete integration examples:

- [Generic Integration](./examples/generic-integration.ts) - Basic usage for any Electron app
- [React Integration](./examples/react-integration.tsx) - React component examples

## 🔄 Changelog

### v1.0.0
- Initial release
- Cross-platform audio capture
- Platform-specific permission handling
- Echo cancellation
- Screenshot capture
- TypeScript support
- React components
- Comprehensive testing
