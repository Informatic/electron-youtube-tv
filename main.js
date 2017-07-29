'use strict';

const TITLE = 'Youtube TV';

const electron = require('electron');
const AutoLaunch = require('auto-launch');
const urlChecker = require('./libs/urlChecker');
const tray = require('./controllers/tray');
const { app, BrowserWindow, webContents, dialog } = electron;

const startMinimized = process.argv.indexOf('--hidden') !== -1;

let mainWindow = null;

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    mainWindow.show();
  }
});

if (shouldQuit) {
  app.quit();
}

let ytAutoLauncher = null;

// A weird thing, but auto-launch doesn't work when used in combination with `app.makeSingleInstance`.
// Hence this weird hack.
try {
  ytAutoLauncher = new AutoLaunch({
    name: TITLE,
    isHidden: true, // This adds a --hidden flag, which we use to start the app minimized
  });
} catch(e) {
  console.log(e);
}

function askStartup() {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Launch on startup', 'Do not launch on startup'],
    title: 'Launch YouTube TV on Windows startup',
    message: 'Do you want to launch Youtube TV on Windows startup? It will be minimized and automatically opens when you cast to it.',
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      ytAutoLauncher.enable();
    }
  });
}
var remoteLaunch = false;

app.on('ready', function() {
  if (ytAutoLauncher) {
    ytAutoLauncher.isEnabled().then((startup) => {
      if (!startup) {
        askStartup();
      }
    });
  }
  mainWindow = new BrowserWindow({
    title: TITLE,
    fullscreen: !startMinimized,
    icon: __dirname + '/favicon.ico',
    show: !startMinimized
  });

  mainWindow.setMenu(null);
  tray.init(mainWindow);

  mainWindow.webContents.on('did-navigate-in-page', (event, url, isMainFrame) => {
    console.info('Navigating to page:', url);
    urlChecker.init(url);

    if (urlChecker.includePath('control') && !mainWindow.isVisible()) {
      console.info('Remote launch!');
      mainWindow.show();
      remoteLaunch = true;
    } else if(urlChecker.includePath('browse-sets') && remoteLaunch == true) {
      console.log('Hiding because remote launch...')
      mainWindow.hide();
      remoteLaunch = false;
    }
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
  });

  mainWindow.loadURL('https://www.youtube.com/tv');

});
