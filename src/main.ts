import { app, BrowserWindow, screen, ipcMain, clipboard, globalShortcut, Menu, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import OpenAI from 'openai';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let optimizeWindow: BrowserWindow | null = null;
let historyWindow: BrowserWindow | null = null;
let welcomeWindow: BrowserWindow | null = null;
let helpWindow: BrowserWindow | null = null;
let isHotkeyPressed = false;
let pressedKeys = new Set();
let lastActiveWindow: number | null = null;
let currentHotkey = 'Control+Shift+D';
let currentDeviceId = '';
let currentLanguage = 'en';
let currentTheme = 'dark';
let apiKey = '';
let openai: OpenAI | null = null;
let optimizeSettings = {
  enabled: false,
  mode: 'professional'
};
let history: { id: string; text: string; timestamp: string; }[] = [];
let hideWelcomeScreen = false;
let windowPosition = { x: 0, y: 0 };

// Load settings from file
function loadSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      currentHotkey = settings.hotkey || currentHotkey;
      currentDeviceId = settings.deviceId || '';
      currentLanguage = settings.language || 'en';
      currentTheme = settings.theme || 'dark';
      optimizeSettings = settings.optimize || optimizeSettings;
      history = settings.history || [];
      apiKey = settings.apiKey || '';
      hideWelcomeScreen = settings.hideWelcomeScreen || false;
      
      if (apiKey) {
        openai = new OpenAI({ apiKey });
      }
      return true;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return false;
}

// Save settings to file
function saveSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const data = JSON.stringify({
      hotkey: currentHotkey,
      deviceId: currentDeviceId,
      language: currentLanguage,
      theme: currentTheme,
      optimize: optimizeSettings,
      history: history,
      apiKey: apiKey,
      hideWelcomeScreen
    });
    fs.writeFileSync(settingsPath, data);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Update API key and OpenAI client
function updateApiKey(newApiKey: string) {
  apiKey = newApiKey;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
  } else {
    openai = null;
  }
  saveSettings();
}

function registerHotkey() {
  try {
    // Unregister existing shortcuts first
    globalShortcut.unregisterAll();
    
    // Clean up the hotkey format
    const cleanHotkey = currentHotkey.replace(/commandorcontrol/i, 'Control');
    
    const success = globalShortcut.register(cleanHotkey, () => {
      if (!isHotkeyPressed) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow && focusedWindow !== mainWindow) {
          lastActiveWindow = focusedWindow.id;
        }
        
        isHotkeyPressed = true;
        if (mainWindow && !mainWindow.isDestroyed()) {
          // No need to set position - just show the window where it was
          mainWindow.setAlwaysOnTop(true, 'screen-saver');
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('hotkey-pressed');
        }
      }
    });

    if (!success) {
      throw new Error(`Failed to register hotkey: ${cleanHotkey}`);
    }
  } catch (error) {
    console.error('Hotkey registration error:', error);
    dialog.showErrorBox('Hotkey Error', `Failed to register hotkey: ${currentHotkey}. Please try a different combination.`);
    // Revert to default hotkey
    currentHotkey = 'Control+Shift+D';
    if (settingsWindow) {
      settingsWindow.webContents.send('current-hotkey', currentHotkey);
    }
    // Try to register the default hotkey
    try {
      globalShortcut.register('Control+Shift+D', () => {
        if (!isHotkeyPressed) {
          isHotkeyPressed = true;
          mainWindow?.show();
          mainWindow?.focus();
          mainWindow?.webContents.send('hotkey-pressed');
        }
      });
    } catch (e) {
      console.error('Failed to register default hotkey:', e);
    }
  }
}

function createSettingsWindow() {
  try {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus();
      return;
    }

    settingsWindow = new BrowserWindow({
      width: 600,
      height: 480,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  } catch (error) {
    console.error('Error creating settings window:', error);
  }
}

function createOptimizeWindow() {
  try {
    if (optimizeWindow && !optimizeWindow.isDestroyed()) {
      optimizeWindow.focus();
      return;
    }

    optimizeWindow = new BrowserWindow({
      width: 500,
      height: 460,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    optimizeWindow.loadFile(path.join(__dirname, 'optimize.html'));

    // Add a handler for the window's close event
    optimizeWindow.on('close', () => {
      // Send a message to the renderer to save settings before the window is destroyed
      if (optimizeWindow && !optimizeWindow.isDestroyed()) {
        optimizeWindow.webContents.send('save-before-close');
      }
    });

    optimizeWindow.on('closed', () => {
      optimizeWindow = null;
    });
  } catch (error) {
    console.error('Error creating optimize window:', error);
  }
}

function createHistoryWindow() {
  if (historyWindow) {
    historyWindow.close();
    return;
  }

  historyWindow = new BrowserWindow({
    width: 625,
    height: 500,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: getBackgroundColor(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  historyWindow.loadFile(path.join(__dirname, 'history.html'));

  historyWindow.on('closed', () => {
    historyWindow = null;
  });
}

function createWelcomeWindow() {
  try {
    if (welcomeWindow && !welcomeWindow.isDestroyed()) {
      welcomeWindow.focus();
      return;
    }

    welcomeWindow = new BrowserWindow({
      width: 960,
      height: 800,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    welcomeWindow.loadFile(path.join(__dirname, 'welcome.html'));

    welcomeWindow.on('closed', () => {
      welcomeWindow = null;
    });
  } catch (error) {
    console.error('Error creating welcome window:', error);
  }
}

function createHelpWindow() {
  try {
    if (helpWindow && !helpWindow.isDestroyed()) {
      helpWindow.focus();
      return;
    }

    helpWindow = new BrowserWindow({
      width: 800,
      height: 700,
      frame: false,
      resizable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    helpWindow.loadFile(path.join(__dirname, 'help.html'));

    helpWindow.on('closed', () => {
      helpWindow = null;
    });
  } catch (error) {
    console.error('Error creating help window:', error);
  }
}

function createWindow() {
  try {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    
    mainWindow = new BrowserWindow({
      width: 624,
      height: 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: true
      }
    });

    windowPosition = { x: Math.floor(width / 2 - 312), y: 0 };
    mainWindow.setPosition(windowPosition.x, windowPosition.y);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Track window position changes
    mainWindow.on('moved', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const [x, y] = mainWindow.getPosition();
        windowPosition = { x, y };
      }
    });

    // Set up initial state when window is ready
    mainWindow.webContents.once('did-finish-load', () => {
      // Send the current optimization status to update the icon
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('optimize-status-changed', optimizeSettings.enabled);
      }
    });

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Settings', click: () => createSettingsWindow() },
      { label: 'Welcome Screen', click: () => createWelcomeWindow() },
      { label: 'Help', click: () => createHelpWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);

    // Handle right-click
    mainWindow.webContents.on('context-menu', () => {
      contextMenu.popup();
    });

    // Track key state in the main process
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyUp' && isHotkeyPressed) {
        isHotkeyPressed = false;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('hotkey-released');
          mainWindow.setAlwaysOnTop(true);
        }
      }
    });

    // Register initial hotkey
    registerHotkey();

    // Handle permission requests
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(false);
      }
    });

    // Handle window height adjustment
    ipcMain.on('adjust-window-height', (event, height) => {
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const [currentWidth] = mainWindow.getSize();
          const [currentX, currentY] = mainWindow.getPosition();
          
          // Make sure height is within reasonable bounds
          const minHeight = 100; // Minimum height when just showing the pill
          const maxHeight = 500; // Maximum height to prevent excessive size
          const newHeight = Math.max(minHeight, Math.min(maxHeight, height));
          
          // Maintain the current X and Y position instead of forcing Y to 0
          mainWindow.setBounds({ 
            x: currentX, 
            y: currentY, 
            width: currentWidth, 
            height: newHeight 
          }, true); // Animate the resize
        }
      } catch (error) {
        console.error('Error adjusting window height:', error);
      }
    });

    // Handle recorded audio
    ipcMain.on('audio-recorded', async (event, buffer) => {
      try {
        if (!openai) {
          safeWindowSend(mainWindow, 'transcription-error', 'Please set your OpenAI API key in settings');
          return;
        }

        safeWindowSend(mainWindow, 'transcription-start');
        
        const tempFile = path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
        fs.writeFileSync(tempFile, buffer);

        try {
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: 'whisper-1',
            language: currentLanguage
          });
  
          fs.unlinkSync(tempFile);
  
          let finalText = transcription.text;
          
          if (optimizeSettings.enabled) {
            safeWindowSend(mainWindow, 'optimization-start');
            finalText = await optimizeText(finalText, optimizeSettings.mode);
          }
  
          safeWindowSend(mainWindow, 'transcription-result', finalText);
          clipboard.writeText(finalText);
  
          setTimeout(() => {
            try {
              if (lastActiveWindow) {
                const window = BrowserWindow.fromId(lastActiveWindow);
                if (window && !window.isDestroyed()) {
                  window.show();
                  window.focus();
                  const menu = Menu.buildFromTemplate([{
                    label: 'Edit',
                    submenu: [{ role: 'paste' }]
                  }]);
                  menu.items[0].submenu?.items[0].click();
                }
                lastActiveWindow = null;
              }
            } catch (error) {
              console.error('Error handling window focus/paste:', error);
            }
          }, 100);
  
          addToHistory(finalText);
        } catch (error) {
          // Make sure we clean up the temp file
          if (fs.existsSync(tempFile)) {
            try {
              fs.unlinkSync(tempFile);
            } catch (e) {
              console.error('Error deleting temp file:', e);
            }
          }
          throw error;
        }
      } catch (error: any) {
        console.error('Error handling recorded audio:', error);
        safeWindowSend(mainWindow, 'transcription-error', error?.message || 'Unknown error occurred');
      }
    });

    // Clean up when window is closed
    mainWindow.on('closed', () => {
      globalShortcut.unregisterAll();
      mainWindow = null;
    });
  } catch (error) {
    console.error('Error creating main window:', error);
    app.quit();
  }
}

// Handle settings-related IPC messages
ipcMain.on('toggle-settings', () => {
  try {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    } else {
      createSettingsWindow();
    }
  } catch (error) {
    console.error('Error toggling settings window:', error);
  }
});

ipcMain.on('close-settings', () => {
  try {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
  } catch (error) {
    console.error('Error closing settings window:', error);
  }
});

ipcMain.on('get-current-hotkey', (event) => {
  event.reply('current-hotkey', currentHotkey);
});

ipcMain.on('update-hotkey', (event, newHotkey) => {
  currentHotkey = newHotkey;
  registerHotkey();
  saveSettings();
});

ipcMain.on('get-current-device', (event) => {
  event.reply('current-device', currentDeviceId);
});

ipcMain.on('update-device', (event, deviceId) => {
  currentDeviceId = deviceId;
  saveSettings();
  // Notify main window to update audio device
  mainWindow?.webContents.send('device-changed', deviceId);
});

// Add optimization settings handlers
ipcMain.on('toggle-optimize', () => {
  try {
    if (optimizeWindow && !optimizeWindow.isDestroyed()) {
      optimizeWindow.close();
    } else {
      createOptimizeWindow();
    }
  } catch (error) {
    console.error('Error toggling optimize window:', error);
  }
});

ipcMain.on('close-optimize', () => {
  try {
    if (optimizeWindow && !optimizeWindow.isDestroyed()) {
      optimizeWindow.close();
    }
  } catch (error) {
    console.error('Error closing optimize window:', error);
  }
});

ipcMain.on('get-optimize-settings', (event) => {
  event.reply('optimize-settings', optimizeSettings);
});

ipcMain.on('update-optimize-settings', (event, settings) => {
  optimizeSettings = settings;
  saveSettings();
  mainWindow?.webContents.send('optimize-status-changed', settings.enabled);
});

// Add handler for save-optimize-settings
ipcMain.on('save-optimize-settings', (event, settings) => {
  optimizeSettings = settings;
  saveSettings();
  mainWindow?.webContents.send('optimize-status-changed', settings.enabled);
});

// Add theme and language handlers
ipcMain.on('get-theme', (event) => {
  event.reply('current-theme', currentTheme);
});

ipcMain.on('update-theme', (event, theme) => {
  currentTheme = theme;
  saveSettings();
  // Notify all windows about theme change
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send('theme-changed', theme);
    }
  });
});

// Add device ID synchronous handler for recording
ipcMain.handle('get-device-id', () => {
  return currentDeviceId;
});

// For backward compatibility with sync calls
ipcMain.on('get-device-id', (event) => {
  event.returnValue = currentDeviceId;
});

ipcMain.on('get-language', (event) => {
  event.reply('current-language', currentLanguage);
});

ipcMain.on('update-language', (event, language) => {
  currentLanguage = language;
  saveSettings();
});

// Add history handlers
ipcMain.on('toggle-history', () => {
  try {
    if (historyWindow && !historyWindow.isDestroyed()) {
      historyWindow.close();
    } else {
      createHistoryWindow();
    }
  } catch (error) {
    console.error('Error toggling history window:', error);
  }
});

ipcMain.on('close-history', () => {
  try {
    if (historyWindow && !historyWindow.isDestroyed()) {
      historyWindow.close();
    }
  } catch (error) {
    console.error('Error closing history window:', error);
  }
});

ipcMain.on('get-history', (event) => {
  event.reply('history-data', history);
});

ipcMain.on('delete-history-item', (event, id) => {
  deleteHistoryItem(id);
});

ipcMain.on('get-api-key', (event) => {
  event.reply('current-api-key', apiKey);
});

ipcMain.on('update-api-key', (event, newApiKey) => {
  updateApiKey(newApiKey);
});

// Add help handlers
ipcMain.on('toggle-help', () => {
  try {
    if (helpWindow && !helpWindow.isDestroyed()) {
      helpWindow.close();
    } else {
      createHelpWindow();
    }
  } catch (error) {
    console.error('Error toggling help window:', error);
  }
});

ipcMain.on('close-help', () => {
  try {
    if (helpWindow && !helpWindow.isDestroyed()) {
      helpWindow.close();
    }
  } catch (error) {
    console.error('Error closing help window:', error);
  }
});

// Clean up shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.whenReady().then(() => {
  // Load settings
  loadSettings();
  
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+F1', () => {
    if (helpWindow && !helpWindow.isDestroyed()) {
      helpWindow.close();
    } else {
      createHelpWindow();
    }
  });
  
  // Show welcome screen if not hidden
  if (!hideWelcomeScreen) {
    createWelcomeWindow();
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (!hideWelcomeScreen) {
        createWelcomeWindow();
      } else {
        createWindow();
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle welcome screen IPC messages
ipcMain.on('close-welcome', (event, dontShowAgain) => {
  try {
    hideWelcomeScreen = dontShowAgain;
    saveSettings();
    if (welcomeWindow && !welcomeWindow.isDestroyed()) {
      welcomeWindow.close();
      createWindow();
    }
  } catch (error) {
    console.error('Error closing welcome window:', error);
  }
});

ipcMain.on('welcome-completed', () => {
  try {
    if (welcomeWindow && !welcomeWindow.isDestroyed()) {
      welcomeWindow.close();
      createWindow();
    }
  } catch (error) {
    console.error('Error completing welcome process:', error);
  }
});

ipcMain.on('save-welcome-settings', (event, settings) => {
  try {
    currentHotkey = settings.hotkey;
    currentDeviceId = settings.deviceId;
    currentTheme = settings.theme;
    apiKey = settings.apiKey;
    hideWelcomeScreen = settings.hideWelcomeScreen;
    
    // Initialize OpenAI client if API key is provided
    if (apiKey) {
      openai = new OpenAI({ apiKey });
    }
    
    // Register the hotkey
    registerHotkey();
    
    // Save the settings
    saveSettings();
    
    // Respond with success
    event.reply('settings-saved');
  } catch (error) {
    console.error('Error saving welcome settings:', error);
  }
});

ipcMain.on('get-settings', (event) => {
  try {
    event.reply('settings', {
      theme: currentTheme,
      hotkey: currentHotkey,
      deviceId: currentDeviceId,
      language: currentLanguage,
      apiKey: apiKey,
      optimize: optimizeSettings,
      hideWelcomeScreen: hideWelcomeScreen
    });
  } catch (error) {
    console.error('Error getting settings:', error);
  }
});

ipcMain.on('get-audio-devices', async (event) => {
  try {
    // Get all media devices
    const devices = await mainWindow?.webContents.executeJavaScript(`
      new Promise((resolve) => {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const audioInputDevices = devices
              .filter(device => device.kind === 'audioinput')
              .map(device => ({
                deviceId: device.deviceId,
                label: device.label || 'Microphone ' + (device.deviceId)
              }));
            resolve(audioInputDevices);
          })
          .catch(err => {
            console.error('Error getting devices:', err);
            resolve([]);
          });
      })
    `);
    
    // If we're calling this before main window is created, use a different approach
    if (!devices || !Array.isArray(devices)) {
      const tempWindow = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });
      
      tempWindow.loadURL('about:blank');
      
      const tempDevices = await tempWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          navigator.mediaDevices.enumerateDevices()
            .then(devices => {
              const audioInputDevices = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                  deviceId: device.deviceId,
                  label: device.label || 'Microphone ' + (device.deviceId)
                }));
              resolve(audioInputDevices);
            })
            .catch(err => {
              console.error('Error getting devices:', err);
              resolve([]);
            });
        })
      `);
      
      tempWindow.close();
      event.reply('audio-devices', tempDevices || []);
    } else {
      event.reply('audio-devices', devices);
    }
  } catch (error) {
    console.error('Error getting audio devices:', error);
    event.reply('audio-devices', []);
  }
});

async function optimizeText(text: string, mode: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error('Please set your OpenAI API key in settings');
    }

    mainWindow?.webContents.send('optimization-start');

    let prompt = '';
    if (mode === 'basic') {
      prompt = `Clean up this transcribed text by:
1. Removing filler words (um, uh, like, you know)
2. Removing repeated words or phrases
3. Adding basic punctuation (periods, commas)
4. Fixing obvious grammar mistakes

Important: Do NOT rephrase or alter the text in any way. Keep all original words and their order exactly the same (except for filler words and repetitions). Return ONLY the cleaned text without quotes or formatting: ${text}`;
    } else if (mode === 'professional') {
      prompt = `Please rewrite the following text to be more professional and suitable for business email communication, while maintaining the original meaning. Return ONLY the rewritten text without quotes or formatting: ${text}`;
    } else if (mode === 'dev') {
      prompt = `Please rewrite the following text to be more precise and technical, suitable for use as AI prompts or technical documentation, while maintaining the original meaning. Return ONLY the rewritten text without quotes or formatting: ${text}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that rewrites text to match specific styles. Always return only the rewritten text without quotes or additional formatting." },
        { role: "user", content: prompt }
      ]
    });

    const optimizedText = (completion.choices[0].message.content || text).replace(/^["']|["']$/g, '').trim();
    mainWindow?.webContents.send('optimization-complete');
    return optimizedText;
  } catch (error: any) {
    console.error('Error optimizing text:', error);
    mainWindow?.webContents.send('optimization-error', error.message || 'Unknown optimization error');
    return text;
  }
}

function safeWindowSend(window: BrowserWindow | null, channel: string, ...args: any[]) {
  try {
    if (window && !window.isDestroyed() && window.webContents) {
      window.webContents.send(channel, ...args);
    }
  } catch (error) {
    console.error(`Error sending message to window (${channel}):`, error);
  }
}

function addToHistory(text: string) {
  const id = Date.now().toString();
  history.unshift({ id, text, timestamp: new Date().toISOString() });
  // Keep only last 100 items
  if (history.length > 100) {
    history = history.slice(0, 100);
  }
  saveSettings();
  if (historyWindow) {
    historyWindow.webContents.send('history-data', history);
  }
}

function deleteHistoryItem(id: string) {
  history = history.filter(item => item.id !== id);
  saveSettings();
  if (historyWindow) {
    historyWindow.webContents.send('history-data', history);
  }
}

// Load settings when app starts
loadSettings();

// Helper function to get the background color based on current theme
function getBackgroundColor() {
  return currentTheme === 'light' ? '#F5F5F5' : '#1E1E1E';
} 