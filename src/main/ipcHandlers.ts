import { ipcMain } from "electron";
import {
  deleteOrder,
  getOrderById,
  getOrders,
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
  verifyToken,
} from "./handlers/auth.js";
import {
  createMenuItem,
  getMenuItems,
  getMenuItemsByCategory,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByName,
  getCategories
} from "./handlers/menu.js";
import { createDeliveryPerson, deleteDeliveryPerson, getDeliveryPersons, getDeliveryPersonStats, updateDeliveryPerson } from "./handlers/delivery.js";

export function registerIpcHandlers() {
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
    ipcMain.handle("get-orders", getOrders);
    ipcMain.handle("update-order", updateOrder);
    ipcMain.handle("get-order-by-id", getOrderById);

  // Menu Item handlers
  ipcMain.handle("create-menu-item", createMenuItem);
  ipcMain.handle("get-menu-items", getMenuItems);
  ipcMain.handle("get-menu-items-by-category", getMenuItemsByCategory);
  ipcMain.handle("update-menu-item", updateMenuItem);
  ipcMain.handle("delete-menu-item", deleteMenuItem);
  ipcMain.handle("get-menu-item-by-id", getMenuItemById);
  ipcMain.handle("get-menu-items-by-name", getMenuItemsByName);
  ipcMain.handle("get-categories", getCategories);

  // delivery person hadnlers
  ipcMain.handle("create-delivery-person", createDeliveryPerson);
  ipcMain.handle("get-delivery-persons", getDeliveryPersons);
  ipcMain.handle("get-delivery-person-stats", getDeliveryPersonStats);
  ipcMain.handle("update-delivery-person", updateDeliveryPerson);
  ipcMain.handle("delete-delivery-person", deleteDeliveryPerson);
}
