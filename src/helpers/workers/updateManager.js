const path = require('path');
const { autoUpdater } = require('electron-updater');
const { BrowserWindow, ipcMain, app, dialog} = require('electron');

let updateDialogWindow, changelogWindow, progressWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// TODO: Add a loader for update checking

function createUpdateDialogWindow(version, mainWindow) {
    updateDialogWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        resizable: false,
        modal: true,
        parent: mainWindow,
        transparent: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, '../../pre-loaders/preload-update-dialog.js'),
        },
    });

    updateDialogWindow.loadFile(path.join(__dirname, '../../templates/update-dialog.html'))
        .then(() => {
            updateDialogWindow.webContents.send('update-info', version);
            console.log('Update dialog loaded successfully');
        })
        .catch((err) => {
            console.error('Failed to load update dialog window:', err);
        });

    if (ipcMain.listenerCount('update-action') > 0) {
        ipcMain.removeAllListeners('update-action');
    }

    ipcMain.once('update-action', (event, action) => {
        if (action === 'update-now') {
            console.log('User chose to update now');
            createProgressWindow(mainWindow);

            autoUpdater.downloadUpdate()
                .then(() => {
                    console.log('Update downloaded');
                    if (progressWindow) {
                        progressWindow.close();
                    }
                })
                .catch((err) => {
                    console.error('Failed to download the new update:', err);
                    if (progressWindow) {
                        progressWindow.close();
                    }
                });

        } else if (action === 'update-later') {
            console.log('User chose to update later');
        }

        if (updateDialogWindow) {
            updateDialogWindow.close();
            updateDialogWindow = null;
        }
    });

    updateDialogWindow.on('closed', () => {
        updateDialogWindow = null;
    });
}

function createProgressWindow(mainWindow) {
    progressWindow = new BrowserWindow({
        width: 800,
        height: 400,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: true,
        modal: true,
        parent: mainWindow,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        },
    });

    progressWindow.loadFile(path.join(__dirname, '../../templates/update-progress.html'))
        .then(() => {
            console.log('Progress window loaded successfully');
        })
        .catch((err) => {
            console.error('Failed to load progress window:', err);
        });

    progressWindow.on('closed', () => {
        progressWindow = null;
    });
}

function createChangelogWindow(releaseNotes = []) {
    changelogWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, '../../pre-loaders/preload-changelog.js'),
        },
        frame: false,
        alwaysOnTop: true,
        resizable: false,
    });

    changelogWindow.loadFile(path.join(__dirname, '../../templates/changelog.html'))
        .then(() => {
            changelogWindow.webContents.send('changelog-data', releaseNotes);
            console.log('Changelog window loaded successfully');
        })
        .catch((err) => {
            console.error('Failed to load changelog window:', err);
        });

    ipcMain.on('minimize-window', () => {
        if (changelogWindow) changelogWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        if (changelogWindow) changelogWindow.close();
    });
}

function checkForUpdates(mainWindow, callFromMenu = false) {
    autoUpdater.checkForUpdates()
        .then((updateCheckResult) => {
            if (updateCheckResult.updateInfo && updateCheckResult.updateInfo.version !== app.getVersion()) {
                createUpdateDialogWindow(updateCheckResult.updateInfo.version, mainWindow);
            } else if (callFromMenu) {
                const currentVersionDetails = `
You already have the latest version of the app.
                
Current Version: ${app.getVersion()}
Electron Version: ${process.versions.electron}
Node.js Version: ${process.versions.node}
V8 Engine Version: ${process.versions.v8}

For more details or to check manually for updates, visit:
https://github.com/theseekerofficial/MLWA-Connect/releases
`;

                dialog.showMessageBox({
                    type: 'info',
                    title: 'No Updates Found',
                    message: currentVersionDetails.trim(),
                })
                    .then(() => {
                        console.log('Current version info displayed');
                    })
                    .catch((err) => {
                        console.error('Failed to display current version info', err);
                    });
            }
        })
        .catch((err) => {
            console.error('Failed to check new updates', err);
            dialog.showMessageBox({
                type: 'error',
                title: 'Update Check Failed',
                message: `Failed to check for updates. Please try again later.\n\nError Details:\n${err.message || 'Unknown error'}`,
            })
                .then(() => {
                    console.log('Failed to check updates', err);
                })
                .catch((err) => {
                    console.error('An error during checking updates', err);
                });
        });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded. The application will restart to apply the update.',
            buttons: ['Restart'],
        }).then(() => {
            autoUpdater.quitAndInstall();
        });
    });

    autoUpdater.on('error', (error) => {
        console.error('Error during update:', error);
        dialog.showMessageBox({
            type: 'error',
            title: 'Update Error',
            message: `Update failed. Please try again later. If the issue persists, uninstall this version and download the latest from: https://github.com/theseekerofficial/MLWA-Connect/releases.\n\n More details about error: ${error}`,
        })
            .then(() => {
                console.log('Failed to apply new update', error);
            })
            .catch((err) => {
                console.error('An error during applying new updates', err);
            });
    });
}

module.exports = {
    createChangelogWindow,
    checkForUpdates
};
