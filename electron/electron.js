const pkg = require('../package.json');
const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    Tray,
    dialog,
    powerSaveBlocker,
    autoUpdater,
    ipcMain,
} = require('electron');
// Module to create native browser window.
//const BrowserWindow = electron.BrowserWindow
const windowStateKeeper = require('electron-window-state');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow


function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });
    // Create the browser window.
    mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        webPreferences: {
            nodeIntegrationInWorker: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/../dist/index.html`)

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
    mainWindowState.manage(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    /*** Handle squirrel install events ***/

    if (process.platform == 'win32') {
        //var exec = require('child_process').exec;     // ?
        var exec = require('child_process').execSync;

        var squirrelCommand = process.argv[1];
        switch (squirrelCommand) {
            case '--squirrel-install':
                var target = path.basename(process.execPath);
                var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
                var iconPath = path.resolve(path.dirname(process.execPath), 'resources/app/build/images/icon.ico');
                //var iconPath = path.resolve(path.dirname(process.execPath), '..', 'app.ico');
                var createShortcut = updateDotExe + ' --createShortcut=' + target + ' --shortcut-locations=Desktop,StartMenu --icon=' + iconPath;
                console.log(createShortcut);
                exec(createShortcut);
                // Always quit when done
                app.quit();

                return true;
            case '--squirrel-updated':

                // Optionally do things such as:
                //
                // - Install desktop and start menu shortcuts
                // - Add your .exe to the PATH
                // - Write to the registry for things like file associations and
                //   explorer context menus
                // TODO ---- do we need to remove icons and re-add them here? so they point to correct exe?

                // Always quit when done
                app.quit();

                return true;
            case '--squirrel-uninstall':
                // Undo anything you did in the --squirrel-install and --squirrel-updated handlers
                var target = path.basename(process.execPath);
                var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
                var createShortcut = updateDotExe + ' --removeShortcut=' + target;
                console.log(createShortcut);
                exec(createShortcut);
                // Always quit when done
                app.quit();

                return true;
            case '--squirrel-obsolete':
                // This is called on the outgoing version of your app before
                // we update to the new version - it's the opposite of
                // --squirrel-updated
                app.quit();
                return true;
        }

    }

    createWindow();
    checkForNewUpdate();


})

/**
 * Handle Updates
 */
function checkForNewUpdate() {
    try {
        let os = require('os'); //https://nodejs.org/api/os.html
        logger.info('Platform = ' + process.platform);
        logger.info('Arch = ' + os.arch());
        let updateFeed, mainVersion, channel;
        channel = pkg.version.split('-');
        if (channel.length > 0)
            updateFeed = 'https://electronreleaseserver.com/update/' + process.platform + '/' + pkg.version + '/' + channel[1];
        else
            updateFeed = 'https://electronreleaseserver.com/update/' + process.platform + '/' + pkg.version;

        if (!process.execPath.match(/[\\\/]electron-prebuilt/)) {
            autoUpdater.setFeedURL(updateFeed);
            autoUpdater.checkForUpdates();
            autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
                var index = dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    buttons: ['Restart', 'Later'],
                    title: 'ngElectron',
                    message: 'A new version has been downloaded. Please restart the application to complete the update.',
                    detail: 'details'
                })
                if (index === 1) return;
                quitAndUpdate();
            })
        }
    } catch (e) {
        let err = dialog.showMessageBox(mainWindow, {
            type: 'error',
            buttons: ['Skip'],
            title: 'ngElectron Autoupdate',
            message: 'An error occured during trying to check for updates and download new updates. May be we do not have this version on our release server.',
            details: e
        })
        if (err === 1) return;
    } finally {

    }

}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.