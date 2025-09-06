const { contextBridge, ipcRenderer } = require("electron");

interface User {
  id?: string;
  username: string;
  password: string;
  role: "admin" | "kitchen" | "delivery" | "staff";
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  syncAt: string;
  isDeleted?: boolean;
}
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
}

interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
  menuItem?: MenuItem;
}
interface DeliveryPerson {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vehicleType: 'bike' | 'motorcycle' | 'car' | 'scooter';
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
}

const syncStatusCallbacks = new Set<(status: any) => void>();
const orderChangeCallbacks = new Set<(change: any, event: any) => void>();

contextBridge.exposeInMainWorld("electronAPI", {
  // Order operations
  saveOrder: (token: string, order: any) =>
    ipcRenderer.invoke("save-order", token, order),
  deleteOrder: (token: string, id: string) =>
    ipcRenderer.invoke("delete-order", token, id),
  getOrders: (token: string) => ipcRenderer.invoke("get-orders", token),
  updateOrder: (token: string, order: any) =>
    ipcRenderer.invoke("update-order", token, order),
  getOrderById: (token: string, id: string) =>
    ipcRenderer.invoke("get-order-by-id", token, id),

  // User operations
  registerUser: (
    token: string,
    userData: Omit<User, "id" | "syncAt" | "createdAt" | "updatedAt">
  ) => ipcRenderer.invoke("register-user", token, userData),
  loginUser: (credentials: { username: string; userPassword: string }) =>
    ipcRenderer.invoke("login-user", credentials),
  logoutUser: (token: string) => ipcRenderer.invoke("logout-user", token),
  getUsers: (token: string) => ipcRenderer.invoke("get-users", token),
  updateUser: (token: string, userData: Partial<User> & { id: string }) =>
    ipcRenderer.invoke("update-user", token, userData),
  deleteUser: (token: string, userId: string) =>
    ipcRenderer.invoke("delete-user", token, userId),

  // menu item operations
  createMenuItem: (
    token: string,
    menuItemData: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
  ) => ipcRenderer.invoke("create-menu-item", token, menuItemData),
  getMenuItems: (token: string) => ipcRenderer.invoke("get-menu-items", token),
  getMenuItemsByCategory: (token: string, category: string) =>
    ipcRenderer.invoke("get-menu-items-by-category", token, category),
  updateMenuItem: (token: string, id: string, updates: Partial<MenuItem>) =>
    ipcRenderer.invoke("update-menu-item", token, id, updates),
  deleteMenuItem: (token: string, id: string) =>
    ipcRenderer.invoke("delete-menu-item", token, id),
  getMenuItemById: (token: string, id: string) =>
    ipcRenderer.invoke("get-menu-item-by-id", token, id),
  getMenuItemsByName: (token: string, name: string) =>
    ipcRenderer.invoke("get-menu-items-by-name", token, name),
  getCategories: (token: string) => ipcRenderer.invoke("get-categories", token),

  // delivery operations
  createDeliveryPerson:(token:string, deliveryPersonData: Omit<DeliveryPerson, "id" | "createdAt" | "updatedAt">) => ipcRenderer.invoke("create-delivery-person", token, deliveryPersonData),
  getDeliveryPersons: (token: string) => ipcRenderer.invoke("get-delivery-persons", token),
  getDeliveryPersonStats: (token: string,deliveryPersonId:string) => ipcRenderer.invoke("get-delivery-person-stats", token,deliveryPersonId),
  updateDeliveryPerson: (token: string,id:string,deliveryPersonData:Partial<DeliveryPerson>) => ipcRenderer.invoke("update-delivery-person", token,id, deliveryPersonData),
  deleteDeliveryPerson: (token: string,id:string,) => ipcRenderer.invoke("delete-delivery-person", token,id),
  assignDeliveryPerson: (token: string,orderId:string,personId:string) => ipcRenderer.invoke("assign-delivery-person", token,orderId,personId),

  // Order Item operations
  createOrderItem: (
    token: string,
    orderItemData: Omit<OrderItem, "id" | "createdAt" | "updatedAt">
  ) => ipcRenderer.invoke("create-order-item", token, orderItemData),
  getOrderItems: (token: string, orderId: string) =>
    ipcRenderer.invoke("get-order-items", token, orderId),

  // Order change notifications
  onOrderChange: (callback: (change: any) => void) => {
    const orderChangeCallback = (event: any, change: any) => {
      callback(change);
    };
    orderChangeCallbacks.add(orderChangeCallback);
    ipcRenderer.on("order-change", orderChangeCallback);

    // Return cleanup function
    return () => {
      orderChangeCallbacks.delete(orderChangeCallback);
      ipcRenderer.removeListener("order-change", orderChangeCallback);
    };
  },
});
