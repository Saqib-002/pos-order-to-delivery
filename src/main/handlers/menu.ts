import { IpcMainInvokeEvent } from "electron";
import { MenuDatabaseOperations } from "../database/Menuoperations.js";
import { MenuItem, OrderItem } from "@/types/Menu.js";
import { syncManager } from "../database/sync.js";
import Logger from "electron-log";

// Menu Items Handlers
export const createMenuItem = async (
    event: IpcMainInvokeEvent,
    token: string,
    menuItemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>
) => {
    try {
        const result = await MenuDatabaseOperations.createMenuItem(menuItemData);
        
        // Trigger sync after creation
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        return result;
    } catch (error) {
        Logger.error("Error creating menu item:", error);
        throw error;
    }
};

export const getMenuItems = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        return await MenuDatabaseOperations.getMenuItems();
    } catch (error) {
        Logger.error("Error getting menu items:", error);
        throw error;
    }
};

export const getMenuItemsByCategory = async (
    event: IpcMainInvokeEvent,
    token: string,
    category: string
) => {
    try {
        return await MenuDatabaseOperations.getMenuItemsByCategory(category);
    } catch (error) {
        Logger.error("Error getting menu items by category:", error);
        throw error;
    }
};

export const updateMenuItem = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string,
    updates: Partial<MenuItem>
) => {
    try {
        const result = await MenuDatabaseOperations.updateMenuItem(id, updates);
        
        // Trigger sync after update
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        return result;
    } catch (error) {
        Logger.error("Error updating menu item:", error);
        throw error;
    }
};

export const deleteMenuItem = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        await MenuDatabaseOperations.deleteMenuItem(id);
        
        // Trigger sync after deletion
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        Logger.info(`Menu item ${id} deleted successfully`);
    } catch (error) {
        Logger.error(`Error deleting menu item ${id}:`, error);
        throw error;
    }
};

export const getMenuItemById = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        return await MenuDatabaseOperations.getMenuItemById(id);
    } catch (error) {
        Logger.error("Error getting menu item by id:", error);
        throw error;
    }
};

export const getCategories = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        return await MenuDatabaseOperations.getCategories();
    } catch (error) {
        Logger.error("Error getting categories:", error);
        throw error;
    }
};

// Order Items Handlers
export const createOrderItem = async (
    event: IpcMainInvokeEvent,
    token: string,
    orderItemData: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>
) => {
    try {
        const result = await MenuDatabaseOperations.createOrderItem(orderItemData);
        
        // Trigger sync after creation
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        return result;
    } catch (error) {
        Logger.error("Error creating order item:", error);
        throw error;
    }
};

export const getOrderItems = async (
    event: IpcMainInvokeEvent,
    token: string,
    orderId: string
) => {
    try {
        return await MenuDatabaseOperations.getOrderItems(orderId);
    } catch (error) {
        Logger.error("Error getting order items:", error);
        throw error;
    }
};