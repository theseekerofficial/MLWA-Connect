const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
});

contextBridge.exposeInMainWorld('changelog', {
    getChangelogData: (callback) => ipcRenderer.on('changelog-data', (event, data) => callback(data)),
});