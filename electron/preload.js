import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // Printer APIs
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    silentPrint: (printerName) => ipcRenderer.invoke('silent-print', printerName),
});
