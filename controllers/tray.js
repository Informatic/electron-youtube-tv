const electron = require('electron');
const path = require('path');
const fs = require('fs');

const { app } = electron;
const platform = require('os').platform();

const { Tray, Menu } = electron;

const APP_TITLE = 'YouTube TV';
const ICON_NAMES = {
  "win32": "build/icon.ico",
  null: "build/icon.png",
}

let mainWindow;
let tray;

const SysTray = function SysTray() {};

SysTray.prototype.init = function init(_mainWindow) {
  tray = null;
  mainWindow = _mainWindow;
  setupTray();
};

function setupTray() {
  tray = new Tray(getIconFilepathForPlatform());
  tray.setToolTip(APP_TITLE);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show app',
      click() { mainWindow.show(); }
    }, { label: 'Hide app',
      click() { mainWindow.hide(); }
    }, { label: 'Exit',
      click() { app.exit(); }
    }
  ]); tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function getIconFilepathForPlatform() {
  let iconName = ICON_NAMES[platform] || ICON_NAMES[null]

  const ICON_PATH = `${__dirname}/../build/`;

  return [
    path.join(__dirname, '..', iconName),
    path.join(process.resourcesPath, iconName),
  ].filter(function(f) { return fs.existsSync(f) })[0];
}

module.exports = new SysTray();
