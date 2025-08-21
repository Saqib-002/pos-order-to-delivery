
const { contextBridge, ipcRenderer } = require('electron');

const dbChangeCallbacks = new Set();

contextBridge.exposeInMainWorld('electronAPI', {
  saveOrder: (order: any) => ipcRenderer.invoke('save-order', order),
  deleteOrder: (id: string) => ipcRenderer.invoke('save-order', id),
  getOrders: () => ipcRenderer.invoke('get-orders'),
  updateOrder: (order: any) => ipcRenderer.invoke('update-order', order),
  getOrderById: (id: string) => ipcRenderer.invoke('get-order-by-id', id),
  onDbChange: (callback:(changes:any)=>void) => {
    // Register the callback
    dbChangeCallbacks.add(callback);
    ipcRenderer.on('db-change', (event:any, change:any) => callback(change));
    // Return a cleanup function
    return () => {
      dbChangeCallbacks.delete(callback);
      ipcRenderer.removeListener('db-change', callback);
    };
  },
});