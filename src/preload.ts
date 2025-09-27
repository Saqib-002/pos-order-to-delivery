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
  vehicleType: "bike" | "motorcycle" | "car" | "scooter";
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
  getSubcategories: (token: string, categoryId: string) =>
    ipcRenderer.invoke("get-sub-categories", token, categoryId),
  getAllSubcategories: (token: string) =>
    ipcRenderer.invoke("get-all-sub-categories", token),
  deleteSubcategory: (token: string, id: string) =>
    ipcRenderer.invoke("delete-sub-category", token, id),
  updateSubcategory: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-sub-category", token, id, updates),
  // variants
  createVariant: (token: string, variantData: any, variantItems: any) =>
    ipcRenderer.invoke("create-variant", token, variantData, variantItems),
  getVariants: (token: string) => ipcRenderer.invoke("get-variants", token),
  deleteVariant: (token: string, id: string) =>
    ipcRenderer.invoke("delete-variant", token, id),
  updateVariant: (token: string, variantData: any, variantItems: any) =>
    ipcRenderer.invoke("update-variant", token, variantData, variantItems),
  // groups
  createGroup: (token: string, groupData: any, groupItems: any) =>
    ipcRenderer.invoke("create-group", token, groupData, groupItems),
  getGroups: (token: string) => ipcRenderer.invoke("get-groups", token),
  deleteGroup: (token: string, id: string) =>
    ipcRenderer.invoke("delete-group", token, id),
  updateGroup: (token: string, groupData: any, groupItems: any) =>
    ipcRenderer.invoke("update-group", token, groupData, groupItems),
  // products
  createProduct: (
    token: string,
    productData: any,
    variantPrices: any,
    addonPages: any
  ) =>
    ipcRenderer.invoke(
      "create-product",
      token,
      productData,
      variantPrices,
      addonPages
    ),
  getProducts: (token: string) => ipcRenderer.invoke("get-products", token),
  deleteProduct: (token: string, id: string) =>
    ipcRenderer.invoke("delete-product", token, id),
  updateProduct: (
    token: string,
    productData: any,
    variantPrices: any,
    addonPages: any
  ) =>
    ipcRenderer.invoke(
      "update-product",
      token,
      productData,
      variantPrices,
      addonPages
    ),
  getVariantsByProductId: (token: string, productId: string) =>
    ipcRenderer.invoke("get-variants-by-product-id", token, productId),
  getAddOnPagesByProductId: (token: string, productId: string) =>
    ipcRenderer.invoke("get-add-on-pages-by-product-id", token, productId),

  // customer operations
  createCustomer: (token: string, customer: any) =>
    ipcRenderer.invoke("create-customer", token, customer),


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
  getOrderAnalytics: (token: string, filter: any) =>
    ipcRenderer.invoke("get-order-analytics", token, filter),
  getOrdersByFilter: (token: string, filter: any) =>
    ipcRenderer.invoke("get-orders-by-filter", token, filter),
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


  // delivery operations
  createDeliveryPerson: (
    token: string,
    deliveryPersonData: Omit<DeliveryPerson, "id" | "createdAt" | "updatedAt">
  ) => ipcRenderer.invoke("create-delivery-person", token, deliveryPersonData),
  getDeliveryPersons: (token: string) =>
    ipcRenderer.invoke("get-delivery-persons", token),
  getDeliveryPersonStats: (token: string, deliveryPersonId: string) =>
    ipcRenderer.invoke("get-delivery-person-stats", token, deliveryPersonId),
  updateDeliveryPerson: (
    token: string,
    id: string,
    deliveryPersonData: Partial<DeliveryPerson>
  ) =>
    ipcRenderer.invoke("update-delivery-person", token, id, deliveryPersonData),
  deleteDeliveryPerson: (token: string, id: string) =>
    ipcRenderer.invoke("delete-delivery-person", token, id),
  assignDeliveryPerson: (token: string, orderId: string, personId: string) =>
    ipcRenderer.invoke("assign-delivery-person", token, orderId, personId),

  // Menu Pages operations
  getMenuPages: (token: string) => ipcRenderer.invoke("get-menu-pages", token),
  getMenuPageById: (token: string, id: string) =>
    ipcRenderer.invoke("get-menu-page-by-id", token, id),
  createMenuPage: (token: string, menuPageData: any) =>
    ipcRenderer.invoke("create-menu-page", token, menuPageData),
  updateMenuPage: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-menu-page", token, id, updates),
  deleteMenuPage: (token: string, id: string) =>
    ipcRenderer.invoke("delete-menu-page", token, id),
  addProductToMenuPage: (
    token: string,
    menuPageId: string,
    productId: string,
    productName: string,
    supplement?: number,
    priority?: number
  ) =>
    ipcRenderer.invoke(
      "add-product-to-menu-page",
      token,
      menuPageId,
      productId,
      productName,
      supplement,
      priority
    ),
  getMenuPageProducts: (token: string, menuPageId: string) =>
    ipcRenderer.invoke("get-menu-page-products", token, menuPageId),
  removeProductFromMenuPage: (
    token: string,
    menuPageId: string,
    productId: string
  ) =>
    ipcRenderer.invoke(
      "remove-product-from-menu-page",
      token,
      menuPageId,
      productId
    ),
  updateMenuPageProduct: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-menu-page-product", token, id, updates),

  // Menus operations
  getMenus: (token: string) => ipcRenderer.invoke("get-menus", token),
  getMenusBySubcategory: (token: string, subcategoryId: string) =>
    ipcRenderer.invoke("get-menus-by-subcategory", token, subcategoryId),
  getMenuById: (token: string, id: string) =>
    ipcRenderer.invoke("get-menu-by-id", token, id),
  createMenu: (token: string, menuData: any) =>
    ipcRenderer.invoke("create-menu", token, menuData),
  updateMenu: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-menu", token, id, updates),
  deleteMenu: (token: string, id: string) =>
    ipcRenderer.invoke("delete-menu", token, id),
  addMenuPageAssociation: (
    token: string,
    menuId: string,
    menuPageId: string,
    pageName: string,
    minimum?: number,
    maximum?: number,
    priority?: number,
    kitchenPriority?: string,
    multiple?: string
  ) =>
    ipcRenderer.invoke(
      "add-menu-page-association",
      token,
      menuId,
      menuPageId,
      pageName,
      minimum,
      maximum,
      priority,
      kitchenPriority,
      multiple
    ),
  getMenuPageAssociations: (token: string, menuId: string) =>
    ipcRenderer.invoke("get-menu-page-associations", token, menuId),
  updateMenuPageAssociation: (token: string, id: string, updates: any) =>
    ipcRenderer.invoke("update-menu-page-association", token, id, updates),
  removeMenuPageAssociation: (token: string, id: string) =>
    ipcRenderer.invoke("remove-menu-page-association", token, id),
  removeAllMenuPageAssociations: (token: string, menuId: string) =>
    ipcRenderer.invoke("remove-all-menu-page-associations", token, menuId),

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
