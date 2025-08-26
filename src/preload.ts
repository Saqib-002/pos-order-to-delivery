const { contextBridge, ipcRenderer } = require('electron');

const dbChangeCallbacks = new Set();
interface User {
  _id: string;
  _rev?: string;
  username: string;
  password: string;
  role: 'admin' | 'kitchen' | 'delivery' | 'staff';
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveOrder: (token:string,order: any) => ipcRenderer.invoke('save-order', token,order),
  deleteOrder: (token:string,id: string) => ipcRenderer.invoke('delete-order', token,id),
  getOrders: (token:string) => ipcRenderer.invoke('get-orders',token),
  updateOrder: (token:string,order: any) => ipcRenderer.invoke('update-order', token, order),
  getOrderById: (token:string,id: string) => ipcRenderer.invoke('get-order-by-id', token, id),

  registerUser: (userData:Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>) => ipcRenderer.invoke('register-user', userData),
  loginUser: (credentials:{ username: string; userPassword: string }) => ipcRenderer.invoke('login-user', credentials),
  logoutUser: (token:string) => ipcRenderer.invoke('logout-user', token),
  getUsers: (token:string) => ipcRenderer.invoke('get-users', token),
  updateUser: (token:string, userData:Partial<User> & { _id: string }) => ipcRenderer.invoke('update-user', token, userData),
  deleteUser: (token:string, userId:string) => ipcRenderer.invoke('delete-user', token, userId),
  verifyToken: (token:string) => ipcRenderer.invoke('verify-token', token),
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