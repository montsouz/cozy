// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose database API to renderer process
contextBridge.exposeInMainWorld("database", {
  saveContent: async (content: string) => {
    return await ipcRenderer.invoke("save-content", content);
  },
  loadContent: async () => {
    return await ipcRenderer.invoke("load-content");
  },
  isReady: async () => {
    return await ipcRenderer.invoke("database-ready");
  },
});
