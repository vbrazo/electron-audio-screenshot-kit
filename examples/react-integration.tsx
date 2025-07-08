// ============================================================================
// REACT INTEGRATION EXAMPLE
// ============================================================================
// This example shows how to integrate electron-audio-screenshot-kit with React

import React, { useState, useEffect } from 'react';
import { PlatformAudioCapture, PlatformPermissionChecker, AudioCaptureUI } from 'electron-audio-screenshot-kit';

// ============================================================================
// BASIC AUDIO RECORDER COMPONENT
// ============================================================================

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [audioChunks, setAudioChunks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

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
        
        // Process the audio chunks as needed
        await processAudioChunks(result.audioChunks);
      }
      
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const processAudioChunks = async (chunks: any[]) => {
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
  };

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

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
            Duration: {recordingDuration}s
          </div>
        </div>
      )}

      {audioChunks.length > 0 && (
        <div className="recording-results">
          <h4>Recording Results</h4>
          <p>Captured {audioChunks.length} audio chunks</p>
          <div className="chunks-summary">
            {audioChunks.map((chunk, index) => (
              <div key={index} className="chunk-info">
                Chunk {index + 1}: {chunk.source} ({chunk.duration}ms)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADVANCED AUDIO HANDLER COMPONENT
// ============================================================================

export function AudioHandler() {
  return (
    <div className="audio-handler">
      <h2>Audio Handler</h2>
      
      {/* Permission checker */}
      <PlatformPermissionChecker
        onPermissionsReady={() => console.log('Ready for audio recording')}
        onPermissionsError={(error) => console.error('Permission error:', error)}
      />
      
      {/* Audio capture UI */}
      <AudioRecorder />
      
      {/* Or use the built-in UI component */}
      <AudioCaptureUI
        onRecordingComplete={(chunks) => {
          console.log('Audio recorded:', chunks);
          // Process with your app's logic
        }}
        onError={(error) => console.error('Recording error:', error)}
      />
    </div>
  );
}

// ============================================================================
// CUSTOM AUDIO PROCESSOR COMPONENT
// ============================================================================

export function CustomAudioProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudio = async (chunks: any[]) => {
    setIsProcessing(true);
    try {
      // Your custom processing logic
      const processedChunks = chunks.map(chunk => ({
        ...chunk,
        processed: true,
        timestamp: Date.now(),
      }));
      
      // Send to your processing pipeline
      await sendToProcessingPipeline(processedChunks);
      
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToProcessingPipeline = async (chunks: any[]) => {
    // Your processing pipeline logic
    console.log('Sending to processing pipeline:', chunks.length);
  };

  return (
    <AudioCaptureUI
      onRecordingComplete={processAudio}
      onError={(error) => console.error('Error:', error)}
    />
  );
}

// ============================================================================
// REAL-TIME AUDIO STREAM COMPONENT
// ============================================================================

export function RealTimeAudioStream() {
  const [streaming, setStreaming] = useState(false);
  const [chunks, setChunks] = useState<any[]>([]);

  const startStreaming = async () => {
    setStreaming(true);
    const audioCapture = new PlatformAudioCapture();
    
    // Start real-time streaming
    await audioCapture.startCapture(1, 'high'); // 1s intervals for real-time
    
    // Set up real-time processing
    audioCapture.onAudioChunk((chunk) => {
      // Process each chunk in real-time
      processRealTimeChunk(chunk);
      setChunks(prev => [...prev, chunk]);
    });
  };

  const processRealTimeChunk = (chunk: any) => {
    // Your real-time processing logic
    console.log('Processing real-time chunk:', chunk);
  };

  return (
    <div>
      <button onClick={startStreaming} disabled={streaming}>
        Start Real-time Streaming
      </button>
      {streaming && (
        <div>
          <p>Streaming... {chunks.length} chunks received</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCREENSHOT WITH AUDIO COMPONENT
// ============================================================================

export function ScreenshotWithAudio() {
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureWithScreenshot = async () => {
    const audioCapture = new PlatformAudioCapture();
    
    // Start recording with automatic screenshots
    await audioCapture.startCapture(10, 'medium'); // Screenshot every 10s
    
    // Manual screenshot capture
    const result = await audioCapture.captureManualScreenshot('high');
    
    if (result.success && result.base64) {
      setScreenshot(result.base64);
      console.log('Screenshot captured:', result.base64.substring(0, 50) + '...');
    }
  };

  return (
    <div>
      <button onClick={captureWithScreenshot}>
        Capture Screenshot with Audio
      </button>
      {screenshot && (
        <div>
          <h4>Screenshot Captured</h4>
          <img 
            src={`data:image/png;base64,${screenshot}`} 
            alt="Captured screenshot" 
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USAGE IN YOUR APP
// ============================================================================

/*
// In your main App component:
import React from 'react';
import { AudioHandler, CustomAudioProcessor, RealTimeAudioStream, ScreenshotWithAudio } from './react-integration';

function App() {
  return (
    <div className="app">
      <h1>My Electron App</h1>
      
      {/* Basic audio recording */}
      <AudioHandler />
      
      {/* Custom audio processing */}
      <CustomAudioProcessor />
      
      {/* Real-time streaming */}
      <RealTimeAudioStream />
      
      {/* Screenshot with audio */}
      <ScreenshotWithAudio />
    </div>
  );
}

export default App;
*/ 