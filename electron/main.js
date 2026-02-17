import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable Hardware Acceleration for better compatibility on all Windows hardware
// (Fixes the common "Black Screen" issue on some laptops)
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
    const isDev = !app.isPackaged;
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../public/icon-512.png')
    });

    // Allow opening DevTools in production for debugging
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
            mainWindow.webContents.openDevTools();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3456');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// ===== IPC HANDLERS FOR PRINTING =====

// Return list of available printers
ipcMain.handle('get-printers', async () => {
    if (!mainWindow) return [];
    try {
        const printers = await mainWindow.webContents.getPrintersAsync();
        return printers.map(p => ({
            name: p.name,
            displayName: p.displayName || p.name,
            isDefault: p.isDefault,
            status: p.status,
        }));
    } catch (e) {
        console.error('getPrintersAsync failed:', e);
        return [];
    }
});

// Silent print to a specific printer (no dialog)
ipcMain.handle('silent-print', async (event, printerName) => {
    return new Promise((resolve) => {
        if (!mainWindow) {
            resolve({ success: false, error: 'No window' });
            return;
        }

        const options = {
            silent: true,
            printBackground: true,
            deviceName: printerName,
            margins: { marginType: 'none' },
        };

        mainWindow.webContents.print(options, (success, failureReason) => {
            if (success) {
                resolve({ success: true });
            } else {
                resolve({ success: false, error: failureReason });
            }
        });
    });
});

// ===== APP LIFECYCLE =====

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
