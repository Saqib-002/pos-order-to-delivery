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
  getAttachProductsByGroupId: (token: string, groupId: string) =>
    ipcRenderer.invoke("get-attach-products-by-group-id", token, groupId),
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
  getAllProducts: (token: string) => ipcRenderer.invoke("get-all-products", token),
  getProductsByCatId: (token: string, catId: string) =>
    ipcRenderer.invoke("get-products-by-cat-id", token, catId),
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
  getProductById: (token: string, productId: string) =>
    ipcRenderer.invoke("get-product-by-id", token, productId),

  // customer operations
  createCustomer: (token: string, customer: any) =>
    ipcRenderer.invoke("create-customer", token, customer),
  getCustomersByPhone: (token: string, phone: string) =>
    ipcRenderer.invoke("get-customers-by-phone", token, phone),
  upsertCustomer: (token: string, customer: any) =>
    ipcRenderer.invoke("upsert-customer", token, customer),


  // Order operations
  saveOrder: (token: string, item:any) =>
    ipcRenderer.invoke("save-order", token, item),
  addItemToOrder: (token: string, orderId: string, item: any) =>
    ipcRenderer.invoke("add-item-to-order", token, orderId, item),
  removeItemFromOrder: (token: string, orderId: string, itemId: string) =>
    ipcRenderer.invoke("remove-item-from-order", token, orderId, itemId),
  removeMenuFromOrder: (token: string, orderId: string, menuId: string,menuSecondaryId:string) =>
    ipcRenderer.invoke("remove-menu-from-order", token, orderId, menuId,menuSecondaryId),
  removeMenuItemFromOrder: (token: string, orderId: string, menuId: string,menuSecondaryId:string, productId: string, menuPageId: string) =>
    ipcRenderer.invoke("remove-menu-item-from-order", token, orderId, menuId,menuSecondaryId, productId, menuPageId),
  updateItemQuantity: (token: string, orderId: string, itemId: string, quantity: number) =>
    ipcRenderer.invoke("update-item-quantity", token, orderId, itemId, quantity),
  updateMenuQuantity: (token: string, orderId: string, menuId: string,menuSecondaryId:string, quantity: number) =>
    ipcRenderer.invoke("update-menu-quantity", token, orderId, menuId,menuSecondaryId, quantity),
  updateOrderItem: (token: string, orderId: string, itemData: any) => ipcRenderer.invoke("update-order-item", token, orderId, itemData),
  getOrderItems: (token: string, orderId: string) =>
    ipcRenderer.invoke("get-order-items", token, orderId),
  deleteOrder: (token: string, id: string) =>
    ipcRenderer.invoke("delete-order", token, id),
  updateOrder: (token: string, orderId: string, orderData: any) =>
    ipcRenderer.invoke("update-order", token, orderId, orderData),
  getOrdersByFilter: (token: string, filter: any) =>
    ipcRenderer.invoke("get-orders-by-filter", token, filter),
  getOrderAnalytics: (token: string, filter: any) =>
    ipcRenderer.invoke("get-order-analytics", token, filter),

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
    deliveryPersonData: any
  ) => ipcRenderer.invoke("create-delivery-person", token, deliveryPersonData),
  getDeliveryPersons: (token: string) =>
    ipcRenderer.invoke("get-delivery-persons", token),
  getDeliveryPersonStats: (token: string, deliveryPersonId: string) =>
    ipcRenderer.invoke("get-delivery-person-stats", token, deliveryPersonId),
  updateDeliveryPerson: (
    token: string,
    id: string,
    deliveryPersonData: any
  ) =>
    ipcRenderer.invoke("update-delivery-person", token, id, deliveryPersonData),
  deleteDeliveryPerson: (token: string, id: string) =>
    ipcRenderer.invoke("delete-delivery-person", token, id),
  assignDeliveryPerson: (token: string, orderId: string, personId: string) =>
    ipcRenderer.invoke("assign-delivery-person", token, orderId, personId),

  // Menu Pages operations
  getMenuPages: (token: string) => ipcRenderer.invoke("get-menu-pages", token),
  createMenuPage: (token: string, menuPageData: any,products: any) =>
    ipcRenderer.invoke("create-menu-page", token, menuPageData,products),
  updateMenuPage: (token: string, id: string, menuPageData: any,products:any) =>
    ipcRenderer.invoke("update-menu-page", token, id, menuPageData,products),
  deleteMenuPage: (token: string, id: string) =>
    ipcRenderer.invoke("delete-menu-page", token, id),
  getMenuPageProducts: (token: string, menuPageId: string) =>
    ipcRenderer.invoke("get-menu-page-products", token, menuPageId),

  // Menus operations
  getMenus: (token: string) => ipcRenderer.invoke("get-menus", token),
  getMenusBySubcategory: (token: string, subcategoryId: string) =>
    ipcRenderer.invoke("get-menus-by-subcategory", token, subcategoryId),
  getMenuById: (token: string, id: string) =>
    ipcRenderer.invoke("get-menu-by-id", token, id),
  createMenu: (token: string, menuData: any, MenuPageAssociations: any) =>
    ipcRenderer.invoke("create-menu", token, menuData, MenuPageAssociations),
  updateMenu: (token: string, id: string, updates: any, MenuPageAssociations: any) =>
    ipcRenderer.invoke("update-menu", token, id, updates, MenuPageAssociations),
  deleteMenu: (token: string, id: string) =>
    ipcRenderer.invoke("delete-menu", token, id),
  getMenuPageAssociations: (token: string, menuId: string) =>
    ipcRenderer.invoke("get-menu-page-associations", token, menuId),

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
