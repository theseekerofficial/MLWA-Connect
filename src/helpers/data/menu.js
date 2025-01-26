const { app, shell, dialog } = require('electron');
const { checkForUpdates } = require("../workers/updateManager");
const {showNotification} = require("../workers/notificationManager");

const createMenuTemplate = (mainWindow) => [
    {
        label: 'MLWA',
        submenu: [
            {
                label: 'Home',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentURL = browserWindow.webContents.getURL();
                        try {
                            const { origin } = new URL(currentURL);
                            const newURL = `${origin}/home`;
                            browserWindow.loadURL(newURL)
                                .then(() => {
                                    console.log(`Navigated to Home page: ${newURL}`);
                                })
                                .catch(err => {
                                    console.error(`Failed to navigate to ${newURL}:`, err);
                                });
                        } catch (error) {
                            console.error('Failed to construct Home URL:', error);
                        }
                    }
                }
            },
            {
                label: 'Reload',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) browserWindow.reload();
                }
            },
            {
                label: 'Logout',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        browserWindow.webContents.executeJavaScript(`
                            function logout() {
                                fetch('/logout', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).then(response => {
                                    if (response.ok) {
                                        window.location.href = '/';
                                    } else {
                                        alert('Logout failed');
                                    }
                                });
                            }
                            logout();
                        `)
                            .then(() => {
                                console.log('Page loaded successfully');
                            })
                            .catch((err) => {
                                console.error('Failed to load page:', err);
                            });
                    }
                }
            },
            {
                label: 'Exit',
                click: () => app.quit()
            }
        ]
    },
    {
        label: 'Tools',
        submenu: [
            {
                label: 'Screenshot',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        browserWindow.webContents.capturePage().then(image => {
                            showNotification(
                                '',
                                'Screenshot of the current screen captured'
                            );
                            dialog.showSaveDialog(browserWindow, {
                                title: 'Save Screenshot',
                                defaultPath: 'screenshot.png',
                                filters: [
                                    { name: 'Images', extensions: ['png'] }
                                ]
                            }).then(file => {
                                if (!file.canceled) {
                                    require('fs').writeFileSync(file.filePath.toString(), image.toPNG());
                                    console.log('Screenshot saved successfully.');
                                }
                            }).catch(err => {
                                console.error('Failed to save screenshot:', err);
                            });
                        }).catch(err => {
                            console.error('Failed to capture screenshot:', err);
                        });
                    }
                }
            },
            {
                label: 'Clear Cache Data',
                click: (menuItem, browserWindow) => {
                    dialog.showMessageBox(browserWindow, {
                        type: 'warning',
                        buttons: ['Yes', 'No'],
                        defaultId: 1,
                        title: 'Clear Cache Data',
                        message: 'Are you sure you want to clear all cache data? This will log you out and clear all session, cookies, and login data.'
                    }).then(result => {
                        if (result.response === 0) {
                            if (browserWindow) {
                                const session = browserWindow.webContents.session;

                                session.clearCache()
                                    .then(() => {
                                        console.log('HTTP cache cleared successfully.');
                                        return session.clearStorageData({
                                            storages: [
                                                'cookies',
                                                'filesystem',
                                                'indexdb',
                                                'localstorage',
                                                'serviceworkers',
                                                'shadercache',
                                                'websql',
                                                'cachestorage'
                                            ],
                                            quotas: ['temporary', 'syncable']
                                        });
                                    })
                                    .then(() => {
                                        console.log('Storage data cleared successfully.');
                                        return session.flushStorageData();
                                    })
                                    .then(() => {
                                        console.log('Storage data flushed successfully.');
                                        showNotification(
                                            '',
                                            'All cached data cleared successfully.',
                                        );
                                        app.relaunch();
                                        app.exit();
                                    })
                                    .catch(err => {
                                        console.error('Failed to clear cache or storage data:', err);
                                    });
                            }
                        }
                    }).catch(err => {
                        console.error('Failed to show dialog:', err);
                    });
                }
            },
            {
                label: 'Toggle Text Select',
                click: (menuItem, browserWindow) => {
                    const currentValue = process.env.DISABLE_TEXT_SELECTION === 'true';
                    process.env.DISABLE_TEXT_SELECTION = currentValue ? 'false' : 'true';

                    console.log(`DISABLE_TEXT_SELECTION set to ${process.env.DISABLE_TEXT_SELECTION}`);

                    showNotification(
                        '',
                        `Text selection ${currentValue ? 'enabled' : 'disabled'} in pages.`
                    );

                    if (browserWindow) {
                        browserWindow.reload();
                    }
                }
            }
        ]
    },
    {
        label: 'Resources',
        submenu: [
            {
                label: 'Update Channel',
                click: () => {
                    shell.openExternal('https://t.me/Mirror_Leech_Web_App')
                        .then(() => {
                            console.log('Opened Update Channel');
                        })
                        .catch(err => {
                            console.error('Failed to open Update Channel:', err);
                        });
                }
            },
            {
                label: 'Support Chat',
                click: () => {
                    shell.openExternal('https://t.me/MLWA_Chat')
                        .then(() => {
                            console.log('Opened Support Chat');
                        })
                        .catch(err => {
                            console.error('Failed to open Support Chat:', err);
                        });
                }
            },
            {
                label: 'Upload Log',
                click: () => {
                    shell.openExternal('https://t.me/+RU9WSQbcfpw0ZTQ9')
                        .then(() => {
                            console.log('Opened Upload Log');
                        })
                        .catch(err => {
                            console.error('Failed to open Upload Log:', err);
                        });
                }
            },
            { type: 'separator' },
            {
                label: 'Source Code',
                click: () => {
                    shell.openExternal('https://github.com/theseekerofficial/MLWA-Connect')
                        .then(() => {
                            console.log('Opened Source Code');
                        })
                        .catch(err => {
                            console.error('Failed to open Source Code:', err);
                        });
                }
            },
            {
                label: 'Releases',
                click: () => {
                    shell.openExternal('https://github.com/theseekerofficial/MLWA-Connect/releases')
                        .then(() => {
                            console.log('Opened Releases Page');
                        })
                        .catch(err => {
                            console.error('Failed to open Releases Page:', err);
                        });
                }
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Zoom In',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentZoom = browserWindow.webContents.getZoomFactor();
                        browserWindow.webContents.setZoomFactor(currentZoom + 0.1);
                    }
                }
            },
            {
                label: 'Zoom Out',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentZoom = browserWindow.webContents.getZoomFactor();
                        browserWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.1));
                    }
                }
            },
            {
                label: 'Reset Zoom',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        browserWindow.webContents.setZoomFactor(1);
                    }
                }
            },
            {
                label: 'Toggle Fullscreen',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const isFullscreen = browserWindow.isFullScreen();
                        browserWindow.setFullScreen(!isFullscreen);

                        if (!isFullscreen) {
                            browserWindow.webContents.once('before-input-event', (event, input) => {
                                if (input.key === 'Escape') {
                                    browserWindow.setFullScreen(false);
                                    event.preventDefault();
                                }
                            });
                        }
                    }
                }
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Contact Us (In App)',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentURL = browserWindow.webContents.getURL();
                        try {
                            const { origin } = new URL(currentURL);
                            const contactUsURL = `${origin}/contact-us`;
                            browserWindow.loadURL(contactUsURL)
                                .then(() => {
                                    console.log(`Navigated to contact us page: ${contactUsURL}`);
                                })
                                .catch(err => {
                                    console.error(`Failed to navigate to ${contactUsURL}:`, err);
                                });
                        } catch (error) {
                            console.error('Failed to construct Contact Us URL:', error);
                        }
                    }
                }
            },
            {
                label: 'Contact Us (TG)',
                click: () => {
                    shell.openExternal('https://t.me/MrUnknown114')
                        .then(() => {
                            console.log('Opened Telegram Contact');
                        })
                        .catch(err => {
                            console.error('Failed to open Telegram link:', err);
                        });
                }
            },
            {
                label: 'Report a Bug',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentURL = browserWindow.webContents.getURL();
                        try {
                            const { origin } = new URL(currentURL);
                            const contactUsURL = `${origin}/contact-us#supportForm`;
                            browserWindow.loadURL(contactUsURL)
                                .then(() => {
                                    console.log(`Navigated to Report a Bug page: ${contactUsURL}`);
                                })
                                .catch(err => {
                                    console.error(`Failed to navigate to ${contactUsURL}:`, err);
                                });
                        } catch (error) {
                            console.error('Failed to construct Report a Bug URL:', error);
                        }
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'FAQ',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        const currentURL = browserWindow.webContents.getURL();
                        try {
                            const { origin } = new URL(currentURL);
                            const faqURL = `${origin}/faq`;
                            browserWindow.loadURL(faqURL)
                                .then(() => {
                                    console.log(`Navigated to FAQ page: ${faqURL}`);
                                })
                                .catch(err => {
                                    console.error(`Failed to navigate to ${faqURL}:`, err);
                                });
                        } catch (error) {
                            console.error('Failed to construct FAQ URL:', error);
                        }
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Check for Updates',
                click: () => {
                    checkForUpdates(mainWindow, true);
                }
            }
        ]
    }
];

module.exports = createMenuTemplate;
