import {app, BrowserWindow, ipcMain, session} from 'electron';
import {join} from 'path';
import * as fs from "node:fs";
import legacy from "legacy-encoding"
import path from "node:path";
import * as csvParse from "csv-parse";
import XLSX from "xlsx"
import gunzip from "gunzip-file"
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

ipcMain.on('read-file',async (event, folderPath) => {
  console.log(folderPath)
  let fileList = fs.readdirSync(folderPath).filter((file) => file.split(".").length > 1)
  let gzFileList = fileList.filter((file) => file.endsWith('.gz'))
  let xlsxFileList = fileList.filter((file) => file.endsWith('.xlsx'))
  console.log(gzFileList, xlsxFileList)
  for (let i = 0; i < gzFileList.length; i++) {
    const filePath = path.join(folderPath, gzFileList[i])
    const rawFilePath = path.join(folderPath, gzFileList[i].split(".")[0] + ".prv")
    if (!fs.existsSync(filePath)) {
      continue
    }
    gunzip(
        filePath,
        rawFilePath,
        async () => {
          await convertToXLSX(event, rawFilePath).catch(console.error)
        })
  }
  fileList = fs.readdirSync(folderPath)
  gzFileList = fileList.filter((file) => file.endsWith('.gz'))
  xlsxFileList = fileList.filter((file) => file.endsWith('.xlsx'))
  const rawFileList = fileList.filter((file) => file.endsWith('.prv'))
  if (gzFileList.length  == xlsxFileList.length && gzFileList.length == rawFileList.length) {
    // delete prv and gz files
    // BUG!
    for (let i = 0; i < rawFileList.length; i++) {
      if (!fs.existsSync(path.join(folderPath, rawFileList[i]))) {
        continue
      }
      fs.rmSync(path.join(folderPath, rawFileList[i]), { force: true })
    }
    for (let i = 0; i < gzFileList.length; i++) {
      if (!fs.existsSync(path.join(folderPath, gzFileList[i]))) {
        continue
      }
      fs.rmSync(path.join(folderPath, gzFileList[i]), { force: true })
    }
  }
});


async function convertToXLSX(event, filePath) {
  const isFileExist = fs.existsSync(filePath)
  if (!isFileExist) {
    event.reply('file-contents', 'File not found');
    return
  }
  const isConverted = fs.existsSync(filePath.split(".")[0] + ".xlsx")
  if (isConverted) {
    event.reply('file-contents', filePath + ".xlsx");
    return
  }
  const data = fs.readFileSync(path.join(filePath));
  const buf = legacy.decode(data, "cp874")
  const utf9buf = legacy.encode(buf, "utf8")
  const record = csvParse.parse(utf9buf,
      {
        delimiter: '|',
      })
  // @ts-ignore
  const arr = await record.toArray()
  const headers = arr.shift()
  const dataAsJson = []
  for(let i = 0; i < arr.length; i++) {
    const item = arr[i]
    const prepared = {}
    for (let j = 0; j < headers.length; j++) {
      prepared[headers[j]] = item[j]
    }
    dataAsJson.push(prepared)
  }
  const newFilePath = path.join(filePath.split(".")[0])+".xlsx"
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataAsJson)
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  fs.writeFileSync(newFilePath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  event.reply('file-contents', newFilePath);
}