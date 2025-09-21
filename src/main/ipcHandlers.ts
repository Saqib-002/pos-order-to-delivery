import { ipcMain } from "electron";
import {
  cancelOrder,
  deleteOrder,
  getOrderAnalytics,
  getOrders,
  getOrdersByFilter,
  markDeliveredOrder,
  readyOrder,
  saveOrder,
  updateOrder,
} from "./handlers/orders.js";
import {
  deleteUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "./handlers/auth.js";
import {
  createMenuItem,
  getMenuItems,
  getMenuItemsByCategory,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByName,
} from "./handlers/menu.js";
import {
  assignDeliveryPersonToOrder,
  createDeliveryPerson,
  deleteDeliveryPerson,
  getDeliveryPersons,
  getDeliveryPersonStats,
  updateDeliveryPerson,
} from "./handlers/delivery.js";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
  getAllSubCategories,
  updateCategory,
  updateSubCategory,
} from "./handlers/categories.js";
import {
  createVariant,
  deleteVariant,
  getVariants,
  updateVariant,
} from "./handlers/variants.js";
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from "./handlers/group.js";
import {
  createProduct,
  deleteProduct,
  getAddOnPagesByProductId,
  getProducts,
  getVariantsByProductId,
  updateProduct,
} from "./handlers/products.js";
import { setupMenuPagesHandlers } from "./handlers/menuPages.js";
import { setupMenusHandlers } from "./handlers/menus.js";

export function registerIpcHandlers() {
  // categories handlers
  ipcMain.handle("create-category", createCategory);
  ipcMain.handle("get-categories", getCategories);
  ipcMain.handle("delete-category", deleteCategory);
  ipcMain.handle("update-category", updateCategory);
  // sub-categories handlers
  ipcMain.handle("create-sub-category", createSubCategory);
  ipcMain.handle("get-sub-categories", getSubCategories);
  ipcMain.handle("get-all-sub-categories", getAllSubCategories);
  ipcMain.handle("delete-sub-category", deleteSubCategory);
  ipcMain.handle("update-sub-category", updateSubCategory);
  // variants handlers
  ipcMain.handle("create-variant", createVariant);
  ipcMain.handle("get-variants", getVariants);
  ipcMain.handle("delete-variant", deleteVariant);
  ipcMain.handle("update-variant", updateVariant);
  // groups handlers
  ipcMain.handle("create-group", createGroup);
  ipcMain.handle("get-groups", getGroups);
  ipcMain.handle("delete-group", deleteGroup);
  ipcMain.handle("update-group", updateGroup);
  // product handlers
  ipcMain.handle("create-product", createProduct);
  ipcMain.handle("get-products", getProducts);
  ipcMain.handle("update-product", updateProduct);
  ipcMain.handle("delete-product", deleteProduct);
  ipcMain.handle("get-variants-by-product-id", getVariantsByProductId);
  ipcMain.handle("get-add-on-pages-by-product-id", getAddOnPagesByProductId);

  // Authentication handlers
  ipcMain.handle("register-user", registerUser);
  ipcMain.handle("login-user", loginUser);
  ipcMain.handle("logout-user", logoutUser);
  ipcMain.handle("get-users", getUsers);
  ipcMain.handle("update-user", updateUser);
  ipcMain.handle("delete-user", deleteUser);

  // Order handlers (with same authorization logic)
  ipcMain.handle("save-order", saveOrder);
  ipcMain.handle("delete-order", deleteOrder);
  ipcMain.handle("cancel-order", cancelOrder);
  ipcMain.handle("ready-order", readyOrder);
  ipcMain.handle("mark-delivered-order", markDeliveredOrder);
  ipcMain.handle("get-orders", getOrders);
  ipcMain.handle("get-order-analytics", getOrderAnalytics);
  ipcMain.handle("get-orders-by-filter", getOrdersByFilter);
  ipcMain.handle("update-order", updateOrder);

  // Menu Item handlers
  ipcMain.handle("create-menu-item", createMenuItem);
  ipcMain.handle("get-menu-items", getMenuItems);
  ipcMain.handle("get-menu-items-by-category", getMenuItemsByCategory);
  ipcMain.handle("update-menu-item", updateMenuItem);
  ipcMain.handle("delete-menu-item", deleteMenuItem);
  ipcMain.handle("get-menu-item-by-id", getMenuItemById);
  ipcMain.handle("get-menu-items-by-name", getMenuItemsByName);

  // delivery person handlers
  ipcMain.handle("create-delivery-person", createDeliveryPerson);
  ipcMain.handle("get-delivery-persons", getDeliveryPersons);
  ipcMain.handle("get-delivery-person-stats", getDeliveryPersonStats);
  ipcMain.handle("update-delivery-person", updateDeliveryPerson);
  ipcMain.handle("delete-delivery-person", deleteDeliveryPerson);
  ipcMain.handle("assign-delivery-person", assignDeliveryPersonToOrder);

  // Menu Pages handlers
  setupMenuPagesHandlers();

  // Menus handlers
  setupMenusHandlers();
}
