const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('update-info', (event, version) => {
        const versionElement = document.getElementById('update-version');
        if (versionElement) {
            versionElement.textContent = version;
        }
    });

    document.getElementById('update-button').addEventListener('click', () => {
        ipcRenderer.send('update-action', 'update-now');
    });

    document.getElementById('later-button').addEventListener('click', () => {
        ipcRenderer.send('update-action', 'update-later');
    });
});
