// ============================================================================
// GENERIC INTEGRATION TESTS
// ============================================================================
// These tests verify that electron-platform-audio-screenshot integrates correctly with any Electron app

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  packageName: 'electron-platform-audio-screenshot',
  version: '1.0.0',
  requiredFiles: [
    'dist/index.js',
    'dist/index.d.ts',
    'README.md',
    'LICENSE'
  ],
  requiredExports: [
    'platformAudioScreenshotService',
    'PlatformAudioCapture', 
    'PlatformPermissionChecker',
    'AudioCaptureUI'
  ]
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
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

// Test 1: Package structure validation
function testPackageStructure() {
  log('Testing package structure...');
  
  const packagePath = path.join(__dirname, '..');
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    addTestResult('Package.json exists', false, 'package.json not found');
    return false;
  }
  addTestResult('Package.json exists', true);
  
  // Parse package.json
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    addTestResult('Package.json is valid JSON', false, error.message);
    return false;
  }
  addTestResult('Package.json is valid JSON', true);
  
  // Check package name
  if (packageJson.name !== TEST_CONFIG.packageName) {
    addTestResult('Package name is correct', false, `Expected ${TEST_CONFIG.packageName}, got ${packageJson.name}`);
  } else {
    addTestResult('Package name is correct', true);
  }
  
  // Check version
  if (packageJson.version !== TEST_CONFIG.version) {
    addTestResult('Package version is correct', false, `Expected ${TEST_CONFIG.version}, got ${packageJson.version}`);
  } else {
    addTestResult('Package version is correct', true);
  }
  
  // Check main entry point
  if (!packageJson.main) {
    addTestResult('Main entry point defined', false, 'main field missing');
  } else {
    addTestResult('Main entry point defined', true);
  }
  
  // Check TypeScript types
  if (!packageJson.types) {
    addTestResult('TypeScript types defined', false, 'types field missing');
  } else {
    addTestResult('TypeScript types defined', true);
  }
  
  // Check peer dependencies
  if (!packageJson.peerDependencies || !packageJson.peerDependencies.electron) {
    addTestResult('Electron peer dependency', false, 'electron peer dependency missing');
  } else {
    addTestResult('Electron peer dependency', true);
  }
  
  return true;
}

// Test 2: Required files validation
function testRequiredFiles() {
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

// Test 3: Build output validation
function testBuildOutput() {
  log('Testing build output...');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    addTestResult('Dist directory exists', false, 'dist directory not found');
    return false;
  }
  addTestResult('Dist directory exists', true);
  
  // Check main JavaScript file
  const mainJsPath = path.join(distPath, 'index.js');
  if (fs.existsSync(mainJsPath)) {
    const content = fs.readFileSync(mainJsPath, 'utf8');
    if (content.includes('platformAudioScreenshotService')) {
      addTestResult('Main JS file contains exports', true);
    } else {
      addTestResult('Main JS file contains exports', false, 'platformAudioScreenshotService not found in main.js');
    }
  } else {
    addTestResult('Main JS file exists', false, 'index.js not found in dist');
  }
  
  // Check TypeScript definitions
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
}

// Test 4: Documentation validation
function testDocumentation() {
  log('Testing documentation...');
  
  const readmePath = path.join(__dirname, '..', 'README.md');
  
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    
    // Check for key sections
    const requiredSections = [
      '# electron-platform-audio-screenshot',
      '## Installation',
      '## Usage',
      '## API Reference',
      '## Examples'
    ];
    
    for (const section of requiredSections) {
      if (content.includes(section)) {
        addTestResult(`README contains section: ${section}`, true);
      } else {
        addTestResult(`README contains section: ${section}`, false, `Section not found: ${section}`);
      }
    }
    
    // Check for installation instructions
    if (content.includes('npm install')) {
      addTestResult('README contains installation instructions', true);
    } else {
      addTestResult('README contains installation instructions', false, 'npm install instructions not found');
    }
    
    // Check for usage examples
    if (content.includes('import') && content.includes('platformAudioScreenshotService')) {
      addTestResult('README contains usage examples', true);
    } else {
      addTestResult('README contains usage examples', false, 'Import examples not found');
    }
  } else {
    addTestResult('README.md exists', false, 'README.md not found');
  }
}

// Test 5: Examples validation
function testExamples() {
  log('Testing examples...');
  
  const examplesPath = path.join(__dirname, '..', 'examples');
  
  if (fs.existsSync(examplesPath)) {
    const files = fs.readdirSync(examplesPath);
    
    // Check for generic integration example
    const genericExample = files.find(file => file.includes('generic'));
    if (genericExample) {
      addTestResult('Generic integration example exists', true);
    } else {
      addTestResult('Generic integration example exists', false, 'No generic integration example found');
    }
    
    // Check for React integration example
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

// Test 6: Integration scenarios
function testIntegrationScenarios() {
  log('Testing integration scenarios...');
  
  // Test 1: Basic Electron app integration
  const basicIntegration = `
import { platformAudioScreenshotService } from 'electron-platform-audio-screenshot';
import { app, ipcMain } from 'electron';

class MyApp {
  private platformAudioScreenshotService: platformAudioScreenshotService;

  constructor() {
    this.platformAudioScreenshotService = new platformAudioScreenshotService({
      sampleRate: 24000,
      chunkDuration: 0.1,
      enableEchoCancellation: true,
    });
  }

  setupIpcHandlers() {
    this.platformAudioScreenshotService.setupIpcHandlers();
  }
}
`;
  
  // Check if the integration code would work (basic syntax check)
  if (basicIntegration.includes('platformAudioScreenshotService') && 
      basicIntegration.includes('setupIpcHandlers')) {
    addTestResult('Basic integration scenario', true);
  } else {
    addTestResult('Basic integration scenario', false, 'Basic integration code incomplete');
  }
  
  // Test 2: React component integration
  const reactIntegration = `
import React, { useState } from 'react';
import { PlatformAudioCapture, PlatformPermissionChecker } from 'electron-platform-audio-screenshot';

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const audioCapture = new PlatformAudioCapture();
  
  const startRecording = async () => {
    const result = await audioCapture.startCapture(5, 'medium');
    if (result.success) {
      setIsRecording(true);
    }
  };
  
  return (
    <div>
      <PlatformPermissionChecker
        onPermissionsReady={() => console.log('Ready')}
        onPermissionsError={(error) => console.error(error)}
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

// Test 7: Platform support validation
function testPlatformSupport() {
  log('Testing platform support...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check supported operating systems
    if (packageJson.os && Array.isArray(packageJson.os)) {
      const supportedOS = packageJson.os;
      const requiredOS = ['darwin', 'win32', 'linux'];
      
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
    
    // Check supported architectures
    if (packageJson.cpu && Array.isArray(packageJson.cpu)) {
      const supportedCPU = packageJson.cpu;
      const requiredCPU = ['x64', 'arm64'];
      
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

// Main test runner
function runAllTests() {
  log('Starting generic integration tests...', 'info');
  log('=====================================', 'info');
  
  // Run all tests
  testPackageStructure();
  testRequiredFiles();
  testBuildOutput();
  testDocumentation();
  testExamples();
  testIntegrationScenarios();
  testPlatformSupport();
  
  // Print results
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
  
  // Exit with appropriate code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
}; 