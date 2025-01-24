const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const { app, BrowserWindow, Menu, session } = require('electron');
const createMenuTemplate = require('./helpers/data/menu.js');
const { checkDomainConnection, checkInternetConnection, showErrorWindow } = require('./helpers/workers/networkManager.js');
const { isAllowedDomain, confirmAndOpenInBrowser } = require('./helpers/workers/domainManager.js');
const { showNotification, subdomainFriendlyNames } = require('./helpers/workers/notificationManager');
const { closeLoaderWindow, showLoaderWindow } = require('./helpers/workers/loadManager.js');
const { checkForUpdates, createChangelogWindow } = require('./helpers/workers/updateManager.js');
const { showInvalidVersionDialog, showOutdatedVersionDialog } = require("./helpers/workers/clientValidationManager");

let changeLogData = null;
let mainWindow, startupLoaderWindow;
let restrictionAdded = false;
let hasShownStartupLoader = false;
let isFirstLaunchAfterUpdate = false;

const isPackaged = app.isPackaged;
const dotenvPath = isPackaged
    ? path.join(process.resourcesPath, '.env')
    : '.env';
require('dotenv').config({ path: dotenvPath });

const changeLogDataFile = path.join(process.resourcesPath, 'change-log-data.json');

async function createStartupLoaderWindow() {
    const { screen } = require('electron');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    return new Promise((resolve, reject) => {
        try {
            startupLoaderWindow = new BrowserWindow({
                width: 400,
                height: 300,
                frame: false,
                resizable: false,
                alwaysOnTop: true,
                transparent: true,
                show: false,
                webPreferences: {
                    contextIsolation: true,
                    nodeIntegration: false,
                },
            });

            startupLoaderWindow.loadFile(path.join(__dirname, 'templates/app_initializer.html')).catch((err) => {
                console.error('Failed to load startup loader window:', err);
                reject(err);
            });

            startupLoaderWindow.setBounds({
                x: Math.round((width - 400) / 2),
                y: Math.round((height - 300) / 2),
                width: 325,
                height: 400,
            });

            startupLoaderWindow.once('ready-to-show', () => {
                startupLoaderWindow.center();
                startupLoaderWindow.show();
                console.log('Startup loader window is ready to show');
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on('ready', async() => {
        if (fs.existsSync(changeLogDataFile)) {
            isFirstLaunchAfterUpdate = true;

            try {
                const fileContent = fs.readFileSync(changeLogDataFile, 'utf-8');
                changeLogData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Failed to read or parse change-log-data.json:', error);
            }

            if (process.env.NODE_ENV === 'production') {
                try {
                    fs.unlinkSync(changeLogDataFile);
                } catch (error) {
                    console.error('Failed to delete change-log-data.json:', error);
                }
            }
        }

        app.setAppUserModelId('MLWA Connect');
        await createStartupLoaderWindow();

        const hasInternet = await checkInternetConnection();
        if (!hasInternet) {
            if (startupLoaderWindow.isVisible()) {
                startupLoaderWindow.hide();
            }
            const errorWindow = showErrorWindow(
                'No Internet Connection',
                "Your machine doesn't have an active internet connection. Connect your PC to the internet and try again to use MLWA Connect."
            );

            ipcMain.on('close-error-window', () => {
                if (startupLoaderWindow) {
                    errorWindow.close()
                    startupLoaderWindow.close();
                }
                showNotification(
                    '',
                    'MLWA Connect was closed due to no internet connection.'
                );
                app.quit();
            });
            return;
        }

        const hasDomainAccess = await checkDomainConnection();
        if (!hasDomainAccess) {
            if (startupLoaderWindow.isVisible()) {
                startupLoaderWindow.hide();
            }
            const errorWindow = showErrorWindow(
                'Domain Unreachable',
                'Unable to connect to the MLWA servers. Please contact telegram support.',
                ['Telegram Support', 'https://t.me/MLWA_Chat']
            );

            ipcMain.on('close-error-window', () => {
                if (startupLoaderWindow) {
                    errorWindow.close()
                    startupLoaderWindow.close();
                }
                showNotification(
                    '',
                    'MLWA Connect was closed due to server unavailability.'
                );
                app.quit();
            });
            return;
        }

        mainWindow = new BrowserWindow({
            width: 1920,
            height: 1080,
            minWidth: 1280,
            minHeight: 720,
            show: false,
            title: "MLWA Connect",
            webPreferences: {
                preload: path.join(__dirname, 'pre-loaders/main-preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['M-Connect-App-Source'] = process.env.X_APP_SOURCE;
            details.requestHeaders['M-Connect-App-Version'] = process.env.APP_VERSION;
            callback({cancel: false, requestHeaders: details.requestHeaders});
        });

        mainWindow.loadURL('https://mlwa.xyz')
            .then(() => {
                console.log('Main page loaded successfully');
            })
            .catch((err) => {
                console.error('Failed to load main page:', err);
            });

        const menuTemplate = createMenuTemplate(mainWindow);
        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);

        if (process.env.NODE_ENV !== 'production') {
            mainWindow.webContents.openDevTools();
        } else {
            mainWindow.webContents.on('devtools-opened', () => {
                mainWindow.webContents.closeDevTools();
            });
        }

        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.setTitle("MLWA Connect");

            if (restrictionAdded) {
                return;
            }

            const currentUrl = mainWindow.webContents.getURL();
            const urlObj = new URL(currentUrl);
            const subdomain = urlObj.hostname.split('.')[0].toUpperCase();
            const friendlyName = subdomainFriendlyNames[subdomain] || 'MLWA Connect';

            if (!hasShownStartupLoader) {
                startupLoaderWindow.webContents.executeJavaScript(`
                const glassContainerHolder = document.querySelector('.glass-container-holder');
                const expandWave = document.createElement('div');
                expandWave.classList.add('expand-wave');
                glassContainerHolder.appendChild(expandWave);
                
                const textElement = document.querySelector('.glass-container .text');
                if (textElement) {
                    textElement.textContent = 'Connected to Servers';
                }
            `);

                hasShownStartupLoader = true;
                let opacity = 1;
                setTimeout(() => {
                    const interval = setInterval(() => {
                        opacity -= 0.1;
                        if (opacity <= 0) {
                            clearInterval(interval);
                            startupLoaderWindow.close();
                            startupLoaderWindow = null;
                            mainWindow.maximize();
                            mainWindow.show();

                            if (isFirstLaunchAfterUpdate) {
                                createChangelogWindow(changeLogData);
                            } else {
                                checkForUpdates(mainWindow, false);
                            }

                            showNotification(
                                'Welcome!',
                                `You are connected to ${subdomain} (${friendlyName})`
                            );
                        } else {
                            startupLoaderWindow.setOpacity(opacity);
                        }
                    }, 50);
                }, 1500);
            } else {
                closeLoaderWindow(mainWindow);
            }
        });

        mainWindow.webContents.session.webRequest.onCompleted((details) => {
            if (details.statusCode === 400 || details.statusCode === 426) {
                restrictionAdded = true

                try {
                    const headers = details.responseHeaders;
                    const flagData = headers['x-flag-data']?.[0] === 'true';
                    const errorMessage = headers['x-detailed-message']?.[0] || 'An error occurred.';

                    if (startupLoaderWindow && !startupLoaderWindow.isDestroyed()) {
                        startupLoaderWindow.hide();
                    }

                    if (details.statusCode === 400 && flagData) {
                        showInvalidVersionDialog(errorMessage, app, mainWindow);
                    } else if (details.statusCode === 426 && flagData) {
                        console.log("Triggering Outdated Version Dialog");
                        if (mainWindow.webContents.isLoading()) {
                            mainWindow.webContents.stop();
                        }
                        mainWindow.webContents.once('did-stop-loading', () => {
                            mainWindow.loadFile(path.join(__dirname, 'templates/outdated_client.html'));
                            mainWindow.webContents.once('did-finish-load', () => {
                                mainWindow.maximize();
                                mainWindow.show();
                                setTimeout(() => {
                                    showOutdatedVersionDialog(app, mainWindow);
                                }, 200);
                            });
                        });
                    }
                } catch (error) {
                    console.error("Error handling web request response:", error);
                }
            }
        });

        mainWindow.webContents.on('page-title-updated', (event) => {
            event.preventDefault();
        });

        mainWindow.webContents.on('will-navigate', (event, url) => {
            if (!isAllowedDomain(url)) {
                event.preventDefault();
                confirmAndOpenInBrowser(mainWindow, url);
            } else {
                showLoaderWindow(mainWindow);
            }
        });

        mainWindow.webContents.setWindowOpenHandler(({url}) => {
            if (!isAllowedDomain(url)) {
                confirmAndOpenInBrowser(mainWindow, url);
                return {action: 'deny'};
            }
            mainWindow.loadURL(url)
                .then(() => {
                    console.log('Page loaded in main window');
                })
                .catch((err) => {
                    console.error('Failed to load page in main window:', err);
                });
            return {action: 'deny'};
        });

        mainWindow.on('closed', () => {
            if (restrictionAdded) {
                app.quit();
            }
        });
    });


    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}
