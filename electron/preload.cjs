const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Printer APIs
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    silentPrint: (printerName, options) => ipcRenderer.invoke('silent-print', printerName, options),
    openCashDrawer: (printerName) => ipcRenderer.invoke('open-cash-drawer', printerName),
});
