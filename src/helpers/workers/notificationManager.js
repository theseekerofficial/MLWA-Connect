const fs = require('fs');
const path = require('path');
const { Notification } = require('electron');

const subdomainFriendlyNames = {
    APP1: 'MLWA Apex',
    APP2: 'MLWA Zenith',
    APP3: 'MLWA Horizon'
};

function showNotification(title, body) {
    const primaryIconPath = path.join('assets/linux.png')
    const fallbackIconPath = path.join(process.resourcesPath, 'assets/linux.png');

    const iconPath = fs.existsSync(primaryIconPath) ? primaryIconPath : fallbackIconPath;

    const notification = new Notification({
        title: title,
        body: body,
        silent: false,
        icon: iconPath
    });

    notification.show();
}

module.exports = {
    showNotification,
    subdomainFriendlyNames
};
