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
  getCategories,
  createOrderItem,
  getOrderItems,
} from "./handlers/menu.js";

export function registerIpcHandlers() {
  // Authentication handlers
  ipcMain.handle("register-user", registerUser);
  ipcMain.handle("login-user", loginUser);
  ipcMain.handle("logout-user", logoutUser);
  ipcMain.handle("get-users", getUsers);
  ipcMain.handle("update-user", updateUser);
  ipcMain.handle("delete-user", deleteUser);

  // Order handlers (with same authorization logic)
  ipcMain.handle("save-order", async (event, token: string, order: any) =>
    saveOrder(event, order)
  );
  ipcMain.handle("delete-order", async (event, token: string, id: string) =>
    deleteOrder(event, id)
  );
  ipcMain.handle("get-orders", async (event, token: string) => getOrders());
  ipcMain.handle("update-order", async (event, token: string, order: any) =>
    updateOrder(event, order)
  );
  ipcMain.handle("get-order-by-id", async (event, token: string, id: string) =>
    getOrderById(event, id)
  );

  // Menu Item handlers
  ipcMain.handle("create-menu-item", createMenuItem);
  ipcMain.handle("get-menu-items", getMenuItems);
  ipcMain.handle("get-menu-items-by-category", getMenuItemsByCategory);
  ipcMain.handle("update-menu-item", updateMenuItem);
  ipcMain.handle("delete-menu-item", deleteMenuItem);
  ipcMain.handle("get-menu-item-by-id", getMenuItemById);
  ipcMain.handle("get-menu-items-by-name", getMenuItemsByName);
  ipcMain.handle("get-categories", getCategories);

  // Order Item handlers
  ipcMain.handle(
    "create-order-item",
    async (event, token: string, orderItemData: any) =>
      createOrderItem(event, token, orderItemData)
  );

  ipcMain.handle(
    "get-order-items",
    async (event, token: string, orderId: string) =>
      getOrderItems(event, token, orderId)
  );
}
