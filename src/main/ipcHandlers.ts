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
    ipcMain.handle("verify-token", verifyToken);

    // Order handlers (with same authorization logic)
    ipcMain.handle("save-order", async (event, token: string, order: any) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin" && role !== "staff") {
            throw new Error("Unauthorized: Admin or Staff access required");
        }
        return saveOrder(event, order);
    });
    
    ipcMain.handle("delete-order", async (event, token: string, id: string) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }
        return deleteOrder(event, id);
    });
    
    ipcMain.handle("get-orders", async (event, token: string) => {
        await verifyToken(event, token);
        return getOrders();
    });
    
    ipcMain.handle("update-order", async (event, token: string, order: any) => {
        const { role } = await verifyToken(event, token);
        if (
            (role === "kitchen" && order.status !== "Ready for Delivery") ||
            (role === "delivery" &&
                !["Out for Delivery", "Delivered"].includes(order.status)) ||
            (role === "staff" &&
                [
                    "Out for Delivery",
                    "Delivered",
                    "Ready for Delivery",
                ].includes(order.status)) ||
            role === "admin"
        ) {
            return updateOrder(event, order);
        }
        throw new Error("Unauthorized: Invalid role for this action");
    });
    
    ipcMain.handle("get-order-by-id", async (event, token: string, id: string) => {
        await verifyToken(event, token);
        return getOrderById(event, id);
    });
    // Menu Item handlers
    ipcMain.handle("create-menu-item", async (event, token: string, menuItemData: any) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }
        return createMenuItem(event, token, menuItemData);
    });

    ipcMain.handle("get-menu-items", async (event, token: string) => {
        await verifyToken(event, token);
        return getMenuItems(event, token);
    });

    ipcMain.handle("get-menu-items-by-category", async (event, token: string, category: string) => {
        await verifyToken(event, token);
        return getMenuItemsByCategory(event, token, category);
    });

    ipcMain.handle("update-menu-item", async (event, token: string, id: string, updates: any) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }
        return updateMenuItem(event, token, id, updates);
    });

    ipcMain.handle("delete-menu-item", async (event, token: string, id: string) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }
        return deleteMenuItem(event, token, id);
    });

    ipcMain.handle("get-menu-item-by-id", async (event, token: string, id: string) => {
        await verifyToken(event, token);
        return getMenuItemById(event, token, id);
    });

    ipcMain.handle("get-categories", async (event, token: string) => {
        await verifyToken(event, token);
        return getCategories(event, token);
    });

    // Order Item handlers
    ipcMain.handle("create-order-item", async (event, token: string, orderItemData: any) => {
        const { role } = await verifyToken(event, token);
        if (role !== "admin" && role !== "staff") {
            throw new Error("Unauthorized: Admin or Staff access required");
        }
        return createOrderItem(event, token, orderItemData);
    });

    ipcMain.handle("get-order-items", async (event, token: string, orderId: string) => {
        await verifyToken(event, token);
        return getOrderItems(event, token, orderId);
    });
}