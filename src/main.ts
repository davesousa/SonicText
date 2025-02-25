import { app, BrowserWindow, screen, ipcMain, clipboard, globalShortcut, Menu, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let optimizeWindow: BrowserWindow | null = null;
let historyWindow: BrowserWindow | null = null;
let isHotkeyPressed = false;
let pressedKeys = new Set();
let lastActiveWindow: number | null = null;
let currentHotkey = 'control+shift+d';
let currentDeviceId = '';
let currentLanguage = 'en';
let currentTheme = 'dark';
let optimizeSettings = {
  enabled: false,
  mode: 'professional'
};
let history: { id: string; text: string; timestamp: string; }[] = [];

// Load settings from file
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
try {
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    currentHotkey = settings.hotkey || currentHotkey;
    currentDeviceId = settings.deviceId || '';
    currentLanguage = settings.language || 'en';
    currentTheme = settings.theme || 'dark';
    optimizeSettings = settings.optimize || optimizeSettings;
    history = settings.history || [];
  }
} catch (error) {
  console.error('Error loading settings:', error);
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify({ 
      hotkey: currentHotkey,
      deviceId: currentDeviceId,
      language: currentLanguage,
      theme: currentTheme,
      optimize: optimizeSettings,
      history: history
    }));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
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
        mainWindow?.setAlwaysOnTop(true, 'screen-saver');
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('hotkey-pressed');
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
      width: 400,
      height: 420,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    optimizeWindow.loadFile(path.join(__dirname, 'optimize.html'));

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
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  historyWindow.loadFile('src/history.html');

  // Wait for the window to load before setting the shape
  historyWindow.webContents.on('did-finish-load', () => {
    if (historyWindow) {
      historyWindow.setBackgroundColor('#00000000');
    }
  });

  historyWindow.on('closed', () => {
    historyWindow = null;
  });
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

    mainWindow.setPosition(Math.floor(width / 2 - 312), 0);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Settings', click: () => createSettingsWindow() },
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
          mainWindow.setSize(currentWidth, height);
        }
      } catch (error) {
        console.error('Error adjusting window height:', error);
      }
    });

    // Handle recorded audio
    ipcMain.on('audio-recorded', async (event, buffer) => {
      try {
        safeWindowSend(mainWindow, 'transcription-start');
        
        const tempFile = path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
        fs.writeFileSync(tempFile, buffer);

        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: 'whisper-1',
          language: currentLanguage
        });

        fs.unlinkSync(tempFile);

        let finalText = transcription.text;
        
        // Only optimize if enabled
        if (optimizeSettings.enabled) {
          safeWindowSend(mainWindow, 'optimization-start');
          finalText = await optimizeText(finalText, optimizeSettings.mode);
        }

        // Send final result only after all processing is complete
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

ipcMain.on('get-language', (event) => {
  event.reply('current-language', currentLanguage);
});

ipcMain.on('update-language', (event, language) => {
  currentLanguage = language;
  saveSettings();
});

// Add history handlers
ipcMain.on('toggle-history', () => {
  createHistoryWindow();
});

ipcMain.on('close-history', () => {
  if (historyWindow) {
    historyWindow.close();
  }
});

ipcMain.on('get-history', (event) => {
  event.reply('history-updated', history);
});

ipcMain.on('delete-history-item', (event, id) => {
  deleteHistoryItem(id);
});

// Clean up shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

async function optimizeText(text: string, mode: string): Promise<string> {
  try {
    // Notify that optimization is starting
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
    historyWindow.webContents.send('history-updated', history);
  }
}

function deleteHistoryItem(id: string) {
  history = history.filter(item => item.id !== id);
  saveSettings();
  if (historyWindow) {
    historyWindow.webContents.send('history-updated', history);
  }
} 