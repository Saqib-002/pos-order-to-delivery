const { contextBridge, ipcRenderer } = require('electron');


interface User {
  id?: string;
  username: string;
  password: string;
  role: 'admin' | 'kitchen' | 'delivery' | 'staff';
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  syncAt: string;
  isDeleted?: boolean;
}
const syncStatusCallbacks = new Set<(status: any) => void>();
const orderChangeCallbacks = new Set<(change: any,event:any) => void>();

contextBridge.exposeInMainWorld('electronAPI', {
  // Order operations
  saveOrder: (token:string,order: any) => ipcRenderer.invoke('save-order', token,order),
  deleteOrder: (token:string,id: string) => ipcRenderer.invoke('delete-order', token,id),
  getOrders: (token:string) => ipcRenderer.invoke('get-orders',token),
  updateOrder: (token:string,order: any) => ipcRenderer.invoke('update-order', token, order),
  getOrderById: (token:string,id: string) => ipcRenderer.invoke('get-order-by-id', token, id),

  // User operations
  registerUser: (userData:Omit<User, 'id' | 'syncAt' | 'createdAt' | 'updatedAt'>) => ipcRenderer.invoke('register-user', userData),
  loginUser: (credentials:{ username: string; userPassword: string }) => ipcRenderer.invoke('login-user', credentials),
  logoutUser: (token:string) => ipcRenderer.invoke('logout-user', token),
  getUsers: (token:string) => ipcRenderer.invoke('get-users', token),
  updateUser: (token:string, userData:Partial<User> & { id: string }) => ipcRenderer.invoke('update-user', token, userData),
  deleteUser: (token:string, userId:string) => ipcRenderer.invoke('delete-user', token, userId),
  verifyToken: (token:string) => ipcRenderer.invoke('verify-token', token),
  // Sync operations
  forceSyncNow: (token: string) => ipcRenderer.invoke('force-sync', token),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),

  // Order change notifications
  onOrderChange: (callback: (change: any) => void) => {
    const orderChangeCallback = (event: any, change: any) => {
      callback(change);
    };
    
    orderChangeCallbacks.add(orderChangeCallback);
    ipcRenderer.on('order-change', orderChangeCallback);
    
    // Return cleanup function
    return () => {
      orderChangeCallbacks.delete(orderChangeCallback);
      ipcRenderer.removeListener('order-change', orderChangeCallback);
    };
  },
  onSyncStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('sync-status', (event: any, status: any) => callback(status));
    return () => ipcRenderer.removeListener('sync-status', callback);
  }
});