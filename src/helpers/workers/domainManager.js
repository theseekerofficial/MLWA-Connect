const { dialog, shell } = require('electron');

const ALLOWED_DOMAINS = [
    'mlwa.xyz',
    'accounts.google.com'
];

function isAllowedDomain(url) {
    try {
        const { hostname } = new URL(url);
        return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
    } catch (error) {
        console.error('Invalid URL:', url);
        return false;
    }
}

function confirmAndOpenInBrowser(mainWindow, url) {
    const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        title: 'You are about to leave MLWA Connect',
        message: `You are about to leave MLWA Connect. ${url} will be opened in your browser.`,
        buttons: ['Okay', 'No'],
        defaultId: 0,
        cancelId: 1
    });

    if (response === 0) {
        shell.openExternal(url)
            .then(() => {
                console.log('External URL Opened in Browser');
            })
            .catch((err) => {
                console.error('Failed to open external url:', err);
            });
    }
}

module.exports = {
    isAllowedDomain,
    confirmAndOpenInBrowser
};
