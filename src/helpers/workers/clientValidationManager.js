const { dialog, shell } = require('electron');
const { checkForUpdates } = require('../../helpers/workers/updateManager.js');

function showOutdatedVersionDialog(app, mainWindow) {
    const options = {
        type: 'warning',
        buttons: ['Check for Updates', 'Close'],
        defaultId: 0,
        cancelId: 1,
        title: 'Outdated Version',
        message: 'Your MLWA Connect version is outdated.',
        detail: 'Please update the app to a more recent version. Use Help > Check for Updates or visit the MLWA Connect release page to download the latest version.',
    };

    const choice = dialog.showMessageBoxSync(mainWindow, options);
    if (choice === 0) {
        checkForUpdates(mainWindow, true);
    } else {
        app.quit();
    }
}

function showInvalidVersionDialog(message, app, mainWindow) {
    console.log("Dialog Message:", message);
    const options = {
        type: 'error',
        buttons: ['Open Releases Page', 'Close'],
        defaultId: 0,
        cancelId: 1,
        title: 'Invalid or Unsupported Version',
        message: 'Invalid or unsupported MLWA Connect Client.',
        detail: `${message}\n\nDownload the legitimate MLWA Client version from the MLWA Connect github release page.`,
    };

    const choice = dialog.showMessageBoxSync(mainWindow, options);
    if (choice === 0) {
        shell.openExternal('https://github.com/theseekerofficial/MLWA-Connect/releases').then(() => {
            console.log('Github release page opened');
        });
        app.quit();
    } else {
        app.quit();
    }
}

module.exports = {
    showOutdatedVersionDialog,
    showInvalidVersionDialog
};
