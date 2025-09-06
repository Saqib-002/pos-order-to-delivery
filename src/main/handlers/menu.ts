import { IpcMainInvokeEvent } from "electron";
import { MenuDatabaseOperations } from "../database/Menuoperations.js";
import { MenuItem, OrderItem } from "@/types/Menu.js";
import { syncManager } from "../database/sync.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

// Menu Items Handlers
export const createMenuItem = async (
  event: IpcMainInvokeEvent,
  token: string,
  menuItemData: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
) => {
  try {
    await verifyToken(event, token);
    const result = await MenuDatabaseOperations.createMenuItem(menuItemData);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error creating menu item:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getMenuItems = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const res = await MenuDatabaseOperations.getMenuItems();
    return {
      status: true,
      data: res,
    };
  } catch (error) {
    Logger.error("Error getting menu items:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getMenuItemsByCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  category: string
) => {
  try {
    const res = await MenuDatabaseOperations.getMenuItemsByCategory(category);
    return {
      status: true,
      data: res,
    };
  } catch (error) {
    Logger.error("Error getting menu items by category:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
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
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error updating menu item:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const deleteMenuItem = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await MenuDatabaseOperations.deleteMenuItem(id);
    Logger.info(`Menu item ${id} deleted successfully`);
    return {
      status: true,
      data: {
        message: `Menu item ${id} deleted successfully`,
      },
    };
  } catch (error) {
    Logger.error(`Error deleting menu item ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getMenuItemById = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    const res = await MenuDatabaseOperations.getMenuItemById(id);
    return {
      status: true,
      data: res,
    };
  } catch (error) {
    Logger.error("Error getting menu item by id:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getMenuItemsByName = async (
  event: IpcMainInvokeEvent,
  token: string,
  name: string
) => {
  try {
    Logger.info(`Search request received for term: "${name}"`);
    await verifyToken(event, token);
    const res = await MenuDatabaseOperations.getMenuItemsByName(name);
    Logger.info(`Search completed, returning ${res.length} results`);
    return {
      status: true,
      data: res,
    };
  } catch (error) {
    Logger.error("Error searching menu items by name:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getCategories = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    const res = await MenuDatabaseOperations.getCategories();
    return {
      status: true,
      data: res,
    };
  } catch (error) {
    Logger.error("Error getting categories:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
