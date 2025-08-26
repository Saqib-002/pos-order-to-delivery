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

export function registerIpcHandlers() {
    // Authentication handlers
    ipcMain.handle("register-user", registerUser);
    ipcMain.handle("login-user", loginUser);
    ipcMain.handle("logout-user", logoutUser);
    ipcMain.handle("get-users", getUsers);
    ipcMain.handle("update-user", updateUser); 
    ipcMain.handle("delete-user", deleteUser);
    ipcMain.handle("verify-token", verifyToken);

    // Order handlers
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
    ipcMain.handle(
        "get-order-by-id",
        async (event, token: string, id: string) => {
            await verifyToken(event, token);
            return getOrderById(event, id);
        }
    );
}
