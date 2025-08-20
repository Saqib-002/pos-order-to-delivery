const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  saveOrder: (order: any) => ipcRenderer.invoke('save-order', order),
  getOrders: () => ipcRenderer.invoke('get-orders'),
  updateOrder: (order: any) => ipcRenderer.invoke('update-order', order),
  getOrderById: (id: string) => ipcRenderer.invoke('get-order-by-id', id),
});