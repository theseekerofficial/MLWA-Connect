const path = require('path');
const { BrowserWindow } = require('electron');

function showErrorWindow(title, message, support = null) {
    const errorWindow = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: false,
        frame: false,
        modal: true,
        transparent: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    errorWindow.loadFile(path.join(__dirname, '../../templates/error_screen.html')).then(() => {
        errorWindow.webContents.executeJavaScript(`
            document.getElementById('title').textContent = "${title}";
            document.getElementById('message').textContent = "${message}";
        `).then(() => {
            console.log('Error screen loaded.');
        });

        if (support) {
            errorWindow.webContents.executeJavaScript(`
                const supportButton = document.getElementById('support-button');
                supportButton.textContent = "${support[0]}";
                supportButton.href = "${support[1]}";
                supportButton.style.display = "block";
            `).then(() => {
                console.log('Support button added.');
            });
        }
    });

    errorWindow.once('ready-to-show', () => {
        errorWindow.show();
    });

    return errorWindow;
}

async function checkInternetConnection() {
    const { AbortController } = await import('node-abort-controller');
    const { default: fetch } = await import('node-fetch');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch('https://google.com', {
            method: 'HEAD',
            signal: controller.signal,
        });
        return response.ok;
    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            console.warn('No internet connection detected.');
        } else {
            console.error('Internet connection check failed:', error.message);
        }
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function checkDomainConnection() {
    const { AbortController } = await import('node-abort-controller');
    const { default: fetch } = await import('node-fetch');

    const domains = [
        'https://app1.mlwa.xyz/health-check',
        'https://app2.mlwa.xyz/health-check',
        'https://app3.mlwa.xyz/health-check',
    ];

    for (const domain of domains) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            console.log(`Checking: ${domain}`);
            const response = await fetch(domain, {
                method: 'HEAD',
                signal: controller.signal,
            });

            if (response.ok) {
                console.log(`Domain online: ${domain}`);
                clearTimeout(timeoutId);
                return true;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error(`Timeout for domain: ${domain}`);
            } else {
                console.error(`Error checking domain ${domain}:`, error.message);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    console.error('All domains are offline.');
    return false;
}

module.exports = {
    checkDomainConnection,
    checkInternetConnection,
    showErrorWindow
};
