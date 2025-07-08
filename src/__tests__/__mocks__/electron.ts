// Mock Electron module for testing

export const ipcMain = {
  handle: jest.fn(),
};

export const desktopCapturer = {
  getSources: jest.fn((_) => [
    {
      id: 'screen:0',
      name: 'Screen 1',
      thumbnail: {
        toJPEG: jest.fn(() => Buffer.from('mock-jpeg')),
        getSize: jest.fn(() => ({ width: 1920, height: 1080 })),
      },
    },
  ]),
};

export const systemPreferences = {
  getMediaAccessStatus: jest.fn(),
  askForMediaAccess: jest.fn(),
};

// Mock other Electron modules as needed
export const app = {
  whenReady: jest.fn(),
  on: jest.fn(),
  quit: jest.fn(),
  isPackaged: false,
};

export const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadURL: jest.fn(),
  on: jest.fn(),
  webContents: {
    on: jest.fn(),
  },
}));

export const screen = {
  getPrimaryDisplay: jest.fn(),
  getAllDisplays: jest.fn(),
};

export const shell = {
  openExternal: jest.fn(),
};

export const dialog = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
};

export const globalShortcut = {
  register: jest.fn(),
  unregister: jest.fn(),
  unregisterAll: jest.fn(),
};

export const clipboard = {
  writeText: jest.fn(),
  readText: jest.fn(),
};

export const nativeImage = {
  createFromDataURL: jest.fn(),
  createFromBuffer: jest.fn(),
};

export const webContents = {
  fromId: jest.fn(),
  getAllWebContents: jest.fn(),
  getFocusedWebContents: jest.fn(),
};

export const session = {
  defaultSession: {
    webRequest: {
      onBeforeRequest: jest.fn(),
    },
  },
};

export const net = {
  request: jest.fn(),
};

export const protocol = {
  registerFileProtocol: jest.fn(),
  registerBufferProtocol: jest.fn(),
};

export const powerMonitor = {
  on: jest.fn(),
  getSystemIdleTime: jest.fn(),
};

export const powerSaveBlocker = {
  start: jest.fn(),
  stop: jest.fn(),
  isStarted: jest.fn(),
};

export const inAppPurchase = {
  purchaseProduct: jest.fn(),
  getProducts: jest.fn(),
  canMakePayments: jest.fn(),
  finishTransactionByDate: jest.fn(),
};

export const contentTracing = {
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  getTraceBufferUsage: jest.fn(),
};

export const crashReporter = {
  start: jest.fn(),
  getLastCrashReport: jest.fn(),
  getUploadedReports: jest.fn(),
  getUploadToServer: jest.fn(),
  setUploadToServer: jest.fn(),
  addExtraParameter: jest.fn(),
  removeExtraParameter: jest.fn(),
  getParameters: jest.fn(),
};

export const process = {
  type: 'browser',
  versions: {
    electron: '1.0.0',
    chrome: '1.0.0',
  },
  platform: 'darwin',
  arch: 'x64',
  env: {},
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};

export const ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  send: jest.fn(),
  sendSync: jest.fn(),
  postMessage: jest.fn(),
};

export const webFrame = {
  setZoomFactor: jest.fn(),
  getZoomFactor: jest.fn(),
  setZoomLevel: jest.fn(),
  getZoomLevel: jest.fn(),
  setVisualZoomLevelLimits: jest.fn(),
  setSpellCheckProvider: jest.fn(),
  insertCSS: jest.fn(),
  insertText: jest.fn(),
  executeJavaScript: jest.fn(),
  getResourceUsage: jest.fn(),
  clearCache: jest.fn(),
};

export const webUtils = {
  getPathForFile: jest.fn(),
  getFileIcon: jest.fn(),
};

export const deprecate = {
  warn: jest.fn(),
  function: jest.fn(),
  event: jest.fn(),
  removeProperty: jest.fn(),
  changeProperty: jest.fn(),
  changeFunction: jest.fn(),
  changeEvent: jest.fn(),
  changeParameter: jest.fn(),
  changeReturnValue: jest.fn(),
  changePropertyType: jest.fn(),
  changeFunctionType: jest.fn(),
  changeEventType: jest.fn(),
  changeParameterType: jest.fn(),
  changeReturnValueType: jest.fn(),
};

export const commandLine = {
  hasSwitch: jest.fn(),
  getSwitchValue: jest.fn(),
  appendSwitch: jest.fn(),
  appendArgument: jest.fn(),
};

export const nativeTheme = {
  shouldUseDarkColors: false,
  shouldUseHighContrastColors: false,
  shouldUseInvertedColorScheme: false,
  themeSource: 'system',
  on: jest.fn(),
};

export const safeStorage = {
  isEncryptionAvailable: jest.fn(),
  encryptString: jest.fn(),
  decryptString: jest.fn(),
  encryptBuffer: jest.fn(),
  decryptBuffer: jest.fn(),
};

export const Notification = jest.fn().mockImplementation(() => ({
  show: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
}));

export const TouchBar = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarButton = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarColorPicker = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarGroup = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarLabel = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarPopover = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarScrubber = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarSegmentedControl = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarSlider = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export const TouchBarSpacer = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
}));

export default {
  ipcMain,
  desktopCapturer,
  systemPreferences,
  app,
  BrowserWindow,
  screen,
  shell,
  dialog,
  globalShortcut,
  clipboard,
  nativeImage,
  webContents,
  session,
  net,
  protocol,
  powerMonitor,
  powerSaveBlocker,
  inAppPurchase,
  contentTracing,
  crashReporter,
  process,
  contextBridge,
  ipcRenderer,
  webFrame,
  webUtils,
  deprecate,
  commandLine,
  nativeTheme,
  safeStorage,
  Notification,
  TouchBar,
  TouchBarButton,
  TouchBarColorPicker,
  TouchBarGroup,
  TouchBarLabel,
  TouchBarPopover,
  TouchBarScrubber,
  TouchBarSegmentedControl,
  TouchBarSlider,
  TouchBarSpacer,
}; 