const { contextBridge, ipcRenderer } = require('electron');


// Note: We can't directly import db here as preload runs in a different context
// Instead, we need to communicate through IPC

contextBridge.exposeInMainWorld('electronAPI', {
  saveOrder: (order: any) => ipcRenderer.invoke('save-order', order),
  getOrders: () => ipcRenderer.invoke('get-orders'),
  updateOrder: (order: any) => ipcRenderer.invoke('update-order', order),
  getOrderById: (id: string) => ipcRenderer.invoke('get-order-by-id', id),
});