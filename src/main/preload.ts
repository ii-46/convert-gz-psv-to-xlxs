import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  readFile: (filePath: string)=> ipcRenderer.send('read-file', filePath)
})
