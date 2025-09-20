const { contextBridge, ipcRenderer } = require("electron");

interface User {
  id?: string;
  username: string;
  password: string;
  role: "admin" | "kitchen" | "manager" | "staff";
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
  licenseNo?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
}

const syncStatusCallbacks = new Set<(status: any) => void>();
const orderChangeCallbacks = new Set<(change: any, event: any) => void>();

contextBridge.exposeInMainWorld("electronAPI", {
  // categories
  createCategory: (token: string, category: any) =>
    ipcRenderer.invoke("create-category", token, category),
  getCategories: (token: string) => ipcRenderer.invoke("get-categories", token),
  deleteCategory: (token: string, id: string) =>
    ipcRenderer.invoke("delete-category", token, id),
  updateCategory: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-category", token, id, updates),
  // sub categories
  createSubcategory: (token: string, subCategory: any) =>
    ipcRenderer.invoke("create-sub-category", token, subCategory),
  getSubcategories: (token: string,categoryId:string) =>
    ipcRenderer.invoke("get-sub-categories", token,categoryId),
  deleteSubcategory: (token: string, id: string) =>
    ipcRenderer.invoke("delete-sub-category", token, id),
  updateSubcategory: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-sub-category", token, id, updates),
  // variants
  createVariant:(token:string,variantData:any,variantItems:any)=>ipcRenderer.invoke("create-variant",token,variantData,variantItems),
  getVariants:(token:string)=>ipcRenderer.invoke("get-variants",token),
  deleteVariant:(token:string,id:string)=>ipcRenderer.invoke("delete-variant",token,id),
  updateVariant:(token:string,variantData:any,variantItems:any)=>ipcRenderer.invoke("update-variant",token,variantData,variantItems),
  // groups
  createGroup:(token:string,groupData:any,groupItems:any)=>ipcRenderer.invoke("create-group",token,groupData,groupItems),
  getGroups:(token:string)=>ipcRenderer.invoke("get-groups",token),
  deleteGroup:(token:string,id:string)=>ipcRenderer.invoke("delete-group",token,id),
  updateGroup:(token:string,groupData:any,groupItems:any)=>ipcRenderer.invoke("update-group",token,groupData,groupItems),
  // products
  createProduct:(token:string,productData:any,variantPrices:any,addonPages:any)=>ipcRenderer.invoke("create-product",token,productData,variantPrices,addonPages),
  getProducts:(token:string)=>ipcRenderer.invoke("get-products",token),
  deleteProduct:(token:string,id:string)=>ipcRenderer.invoke("delete-product",token,id),
  updateProduct:(token:string,productData:any,variantPrices:any,addonPages:any)=>ipcRenderer.invoke("update-product",token,productData,variantPrices,addonPages),



  // Order operations
  saveOrder: (token: string, order: any) =>
    ipcRenderer.invoke("save-order", token, order),
  deleteOrder: (token: string, id: string) =>
    ipcRenderer.invoke("delete-order", token, id),
  cancelOrder: (token: string, id: string) =>
    ipcRenderer.invoke("cancel-order", token, id),
  readyOrder: (token: string, id: string) =>
    ipcRenderer.invoke("ready-order", token, id),
  markDeliveredOrder: (token: string, id: string) =>
    ipcRenderer.invoke("mark-delivered-order", token, id),
  getOrders: (token: string) => ipcRenderer.invoke("get-orders", token),
  getOrderAnalytics: (token: string,filter:any) => ipcRenderer.invoke("get-order-analytics", token,filter),
  getOrdersByFilter: (token: string,filter:any) => ipcRenderer.invoke("get-orders-by-filter", token,filter),
  updateOrder: (token: string, order: any) =>
    ipcRenderer.invoke("update-order", token, order),

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

  // delivery operations
  createDeliveryPerson:(token:string, deliveryPersonData: Omit<DeliveryPerson, "id" | "createdAt" | "updatedAt">) => ipcRenderer.invoke("create-delivery-person", token, deliveryPersonData),
  getDeliveryPersons: (token: string) => ipcRenderer.invoke("get-delivery-persons", token),
  getDeliveryPersonStats: (token: string,deliveryPersonId:string) => ipcRenderer.invoke("get-delivery-person-stats", token,deliveryPersonId),
  updateDeliveryPerson: (token: string,id:string,deliveryPersonData:Partial<DeliveryPerson>) => ipcRenderer.invoke("update-delivery-person", token,id, deliveryPersonData),
  deleteDeliveryPerson: (token: string,id:string,) => ipcRenderer.invoke("delete-delivery-person", token,id),
  assignDeliveryPerson: (token: string,orderId:string,personId:string) => ipcRenderer.invoke("assign-delivery-person", token,orderId,personId),

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
