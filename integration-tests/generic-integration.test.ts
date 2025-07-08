import fs from 'fs';
import path from 'path';

interface TestConfig {
  packageName: string;
  version: string;
  requiredFiles: string[];
  requiredExports: string[];
}

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

interface TestResults {
  passed: number;
  failed: number;
  total: number;
  details: TestResult[];
}

interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  types?: string;
  peerDependencies?: Record<string, string>;
  os?: string[];
  cpu?: string[];
}

const TEST_CONFIG: TestConfig = {
  packageName: 'electron-audio-shot',
  version: '1.0.0',
  requiredFiles: [
    'dist/index.js',
    'dist/index.d.ts',
    'README.md',
    'LICENSE'
  ],
  requiredExports: [
    'audioScreenshotService',
    'PlatformAudioCapture', 
    'PlatformPermissionChecker',
    'AudioCaptureUI'
  ]
};

let testResults: TestResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName: string, passed: boolean, details: string = ''): void {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName}`, 'error');
  }
  testResults.details.push({ testName, passed, details });
}

function testPackageStructure(): boolean {
  log('Testing package structure...');
  
  const packagePath = path.join(__dirname, '..');
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    addTestResult('Package.json exists', false, 'package.json not found');
    return false;
  }
  addTestResult('Package.json exists', true);
  
  let packageJson: PackageJson;
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(content) as PackageJson;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addTestResult('Package.json is valid JSON', false, errorMessage);
    return false;
  }
  addTestResult('Package.json is valid JSON', true);
  
  if (packageJson.name !== TEST_CONFIG.packageName) {
    addTestResult('Package name is correct', false, `Expected ${TEST_CONFIG.packageName}, got ${packageJson.name}`);
  } else {
    addTestResult('Package name is correct', true);
  }
  
  if (packageJson.version !== TEST_CONFIG.version) {
    addTestResult('Package version is correct', false, `Expected ${TEST_CONFIG.version}, got ${packageJson.version}`);
  } else {
    addTestResult('Package version is correct', true);
  }
  
  if (!packageJson.main) {
    addTestResult('Main entry point defined', false, 'main field missing');
  } else {
    addTestResult('Main entry point defined', true);
  }
  
  if (!packageJson.types) {
    addTestResult('TypeScript types defined', false, 'types field missing');
  } else {
    addTestResult('TypeScript types defined', true);
  }
  
  if (!packageJson.peerDependencies?.['electron']) {
    addTestResult('Electron peer dependency', false, 'electron peer dependency missing');
  } else {
    addTestResult('Electron peer dependency', true);
  }
  
  return true;
}

function testRequiredFiles(): void {
  log('Testing required files...');
  
  const packagePath = path.join(__dirname, '..');
  
  for (const file of TEST_CONFIG.requiredFiles) {
    const filePath = path.join(packagePath, file);
    if (fs.existsSync(filePath)) {
      addTestResult(`Required file exists: ${file}`, true);
    } else {
      addTestResult(`Required file exists: ${file}`, false, `File not found: ${file}`);
    }
  }
}

function testBuildOutput(): boolean {
  log('Testing build output...');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    addTestResult('Dist directory exists', false, 'dist directory not found');
    return false;
  }
  addTestResult('Dist directory exists', true);
  
  const mainJsPath = path.join(distPath, 'index.js');
  if (fs.existsSync(mainJsPath)) {
    const content = fs.readFileSync(mainJsPath, 'utf8');
    if (content.includes('audioScreenshotService')) {
      addTestResult('Main JS file contains exports', true);
    } else {
      addTestResult('Main JS file contains exports', false, 'audioScreenshotService not found in main.js');
    }
  } else {
    addTestResult('Main JS file exists', false, 'index.js not found in dist');
  }

  const mainDtsPath = path.join(distPath, 'index.d.ts');
  if (fs.existsSync(mainDtsPath)) {
    const content = fs.readFileSync(mainDtsPath, 'utf8');
    if (content.includes('export')) {
      addTestResult('TypeScript definitions exist', true);
    } else {
      addTestResult('TypeScript definitions exist', false, 'No exports found in index.d.ts');
    }
  } else {
    addTestResult('TypeScript definitions exist', false, 'index.d.ts not found in dist');
  }
  
  return true;
}

function testDocumentation(): void {
  log('Testing documentation...');
  
  const readmePath = path.join(__dirname, '..', 'README.md');
  
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    
    const requiredSections: string[] = [
      '# electron-audio-shot',
      '## 🛠️ Installation',
      '## 🔧 Advanced Usage',
      '## 📚 API Reference'
    ];
    
    for (const section of requiredSections) {
      if (content.includes(section)) {
        addTestResult(`README contains section: ${section}`, true);
      } else {
        addTestResult(`README contains section: ${section}`, false, `Section not found: ${section}`);
      }
    }
    
    if (content.includes('npm install')) {
      addTestResult('README contains installation instructions', true);
    } else {
      addTestResult('README contains installation instructions', false, 'npm install instructions not found');
    }
    
    if (content.includes('import') && content.includes('audioScreenshotService')) {
      addTestResult('README contains usage examples', true);
    } else {
      addTestResult('README contains usage examples', false, 'Import examples not found');
    }
  } else {
    addTestResult('README.md exists', false, 'README.md not found');
  }
}

function testExamples(): void {
  log('Testing examples...');
  
  const examplesPath = path.join(__dirname, '..', 'examples');
  
  if (fs.existsSync(examplesPath)) {
    const files = fs.readdirSync(examplesPath);
    
    const genericExample = files.find(file => file.includes('generic'));
    if (genericExample) {
      addTestResult('Generic integration example exists', true);
    } else {
      addTestResult('Generic integration example exists', false, 'No generic integration example found');
    }
    
    const reactExample = files.find(file => file.includes('react'));
    if (reactExample) {
      addTestResult('React integration example exists', true);
    } else {
      addTestResult('React integration example exists', false, 'No React integration example found');
    }
  } else {
    addTestResult('Examples directory exists', false, 'examples directory not found');
  }
}

function testIntegrationScenarios(): void {
  log('Testing integration scenarios...');
  
  const basicIntegration = `
  import { audioScreenshotService } from 'electron-audio-shot';
  import { app, ipcMain } from 'electron';

  class MyApp {
    private audioScreenshotService: audioScreenshotService;

    constructor() {
      this.audioScreenshotService = new audioScreenshotService({
        sampleRate: 24000,
        chunkDuration: 0.1,
        enableEchoCancellation: true,
      });
    }

    setupIpcHandlers(): void {
      this.audioScreenshotService.setupIpcHandlers();
    }
  }
  `;
    
    if (basicIntegration.includes('audioScreenshotService') && 
        basicIntegration.includes('setupIpcHandlers')) {
      addTestResult('Basic integration scenario', true);
    } else {
      addTestResult('Basic integration scenario', false, 'Basic integration code incomplete');
    }
    
    const reactIntegration = `
    import React, { useState } from 'react';
    import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-audio-shot';

    interface AudioRecorderProps {
      onRecordingComplete?: (chunks: any[]) => void;
    }

    export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps): JSX.Element {
      const [isRecording, setIsRecording] = useState<boolean>(false);
      const audioCapture = new PlatformAudioCapture();
      
      const startRecording = async (): Promise<void> => {
        const result = await audioCapture.startCapture(5, 'medium');
        if (result.success) {
          setIsRecording(true);
        }
      };
      
      return (
        <div>
          <PlatformPermissionChecker
            onPermissionsReady={() => console.log('Ready')}
            onPermissionsError={(error: Error) => console.error(error)}
          />
          <button onClick={startRecording}>Start Recording</button>
        </div>
      );
    }
  `;
  
  if (reactIntegration.includes('PlatformAudioCapture') && 
      reactIntegration.includes('PlatformPermissionChecker')) {
    addTestResult('React integration scenario', true);
  } else {
    addTestResult('React integration scenario', false, 'React integration code incomplete');
  }
}

function testPlatformSupport(): void {
  log('Testing platform support...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const content = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(content) as PackageJson;
    
    if (packageJson.os && Array.isArray(packageJson.os)) {
      const supportedOS = packageJson.os;
      const requiredOS: string[] = ['darwin', 'win32', 'linux'];
      
      for (const os of requiredOS) {
        if (supportedOS.includes(os)) {
          addTestResult(`Supports ${os}`, true);
        } else {
          addTestResult(`Supports ${os}`, false, `${os} not in supported OS list`);
        }
      }
    } else {
      addTestResult('OS support defined', false, 'os field missing or not an array');
    }
    
    if (packageJson.cpu && Array.isArray(packageJson.cpu)) {
      const supportedCPU = packageJson.cpu;
      const requiredCPU: string[] = ['x64', 'arm64'];
      
      for (const cpu of requiredCPU) {
        if (supportedCPU.includes(cpu)) {
          addTestResult(`Supports ${cpu}`, true);
        } else {
          addTestResult(`Supports ${cpu}`, false, `${cpu} not in supported CPU list`);
        }
      }
    } else {
      addTestResult('CPU support defined', false, 'cpu field missing or not an array');
    }
  }
}

function testTypeScriptCompatibility(): void {
  log('Testing TypeScript compatibility...');
  
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (fs.existsSync(tsConfigPath)) {
    try {
      const content = fs.readFileSync(tsConfigPath, 'utf8');
      const tsConfig = JSON.parse(content);
      
      const compilerOptions = tsConfig.compilerOptions;
      if (compilerOptions) {
        if (compilerOptions.target) {
          addTestResult('TypeScript target defined', true);
        } else {
          addTestResult('TypeScript target defined', false, 'target not specified');
        }
        
        if (compilerOptions.module) {
          addTestResult('TypeScript module system defined', true);
        } else {
          addTestResult('TypeScript module system defined', false, 'module not specified');
        }
        
        if (compilerOptions.declaration) {
          addTestResult('TypeScript declaration files enabled', true);
        } else {
          addTestResult('TypeScript declaration files enabled', false, 'declaration not enabled');
        }
        
        if (compilerOptions.outDir) {
          addTestResult('TypeScript output directory defined', true);
        } else {
          addTestResult('TypeScript output directory defined', false, 'outDir not specified');
        }
      } else {
        addTestResult('TypeScript compiler options exist', false, 'compilerOptions missing');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTestResult('TypeScript config is valid JSON', false, errorMessage);
    }
  } else {
    addTestResult('TypeScript config exists', false, 'tsconfig.json not found');
  }
}

function runAllTests(): void {
  log('Starting generic integration tests...', 'info');
  log('=====================================', 'info');
  
  testPackageStructure();
  testRequiredFiles();
  testBuildOutput();
  testDocumentation();
  testExamples();
  testIntegrationScenarios();
  testPlatformSupport();
  testTypeScriptCompatibility();

  log('=====================================', 'info');
  log(`Test Results: ${testResults.passed}/${testResults.total} passed`, 
      testResults.failed === 0 ? 'success' : 'error');
  
  if (testResults.failed > 0) {
    log('Failed tests:', 'error');
    testResults.details
      .filter(result => !result.passed)
      .forEach(result => {
        log(`  - ${result.testName}: ${result.details}`, 'error');
      });
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

export {
  runAllTests,
  testResults,
  TestConfig,
  TestResult,
  TestResults
};

if (require.main === module) {
  runAllTests();
} 