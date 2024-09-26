import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string, payload: string) => {
    console.log('Sending message to main process:', payload)
    ipcRenderer.send('read-file', payload)
  },
  // readFile: (filePath: string)=> ipcRenderer.send('read-file', filePath)
})
