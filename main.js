'use strict';

const TITLE = 'Youtube TV';

const electron = require('electron');
const AutoLaunch = require('auto-launch');
const urlChecker = require('./libs/urlChecker');
const tray = require('./controllers/tray');
const { app, BrowserWindow, webContents, dialog } = electron;

const startMinimized = process.argv.indexOf('--hidden') !== -1;

let mainWindow = null;
let lastInputEvent = 0;

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    mainWindow.show();
  }
});

if (shouldQuit) {
  app.quit();
}

var remoteLaunch = false;

app.on('ready', function() {
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
    } else if(urlChecker.includePath('browse-sets') && remoteLaunch == true && new Date() - lastInputEvent > 1000) {
      console.log('Hiding because remote launch...')
      mainWindow.hide();
      remoteLaunch = false;
    }
  });

  mainWindow.webContents.on('before-input-event', (event) => {
    lastInputEvent = new Date();
    console.info('Updating last input event');
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);

    // Stop video on window close
    mainWindow.loadURL('https://www.youtube.com/tv');
  });

  mainWindow.on('show', (e) => {
    mainWindow.focus();
    mainWindow.maximize();
    mainWindow.setFullScreen(false);
    mainWindow.setFullScreen(true);
  });

  mainWindow.loadURL('https://www.youtube.com/tv');
});
