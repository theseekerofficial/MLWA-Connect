const path = require('path');
const { WebContentsView, BrowserWindow } = require('electron');

let loaderWindow = null;

function showLoaderWindow(mainWindow) {
    if (loaderWindow) return;

    loaderWindow = new BrowserWindow({
        parent: mainWindow,
        show: false,
        frame: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const loaderView = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    loaderWindow.setContentView(loaderView);

    const { x, y, width, height } = mainWindow.getBounds();
    loaderWindow.setBounds({ x: x + 3, y: y, width: width - 8.5, height: height - 8.5 });

    loaderView.webContents.loadFile(path.join(__dirname, '../../templates/loader.html'))
        .then(() => {
            fadeInWindow(loaderWindow);
        })
        .catch((err) => {
            console.error('Failed to load loader view:', err);
        });
}

function closeLoaderWindow() {
    if (loaderWindow) {

        fadeOutWindow(loaderWindow, () => {
            loaderWindow.destroy();
            loaderWindow = null;
        });
    }
}

function fadeInWindow(window) {
    let opacity = 0;
    window.setOpacity(opacity);
    window.show();
    const interval = setInterval(() => {
        if (opacity >= 1) {
            clearInterval(interval);
        } else {
            opacity += 0.1;
            window.setOpacity(opacity);
        }
    }, 15);
}

function fadeOutWindow(window, callback) {
    let opacity = window.getOpacity();
    const interval = setInterval(() => {
        if (opacity <= 0) {
            clearInterval(interval);
            callback();
        } else {
            opacity -= 0.1;
            window.setOpacity(opacity);
        }
    }, 15);
}

module.exports = {
    showLoaderWindow,
    closeLoaderWindow,
};
