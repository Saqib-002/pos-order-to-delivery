import { IpcMainInvokeEvent } from "electron";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { CategoryDatabaseOperations } from "../database/categoriesOperations.js";
export const createCategory= async (event: IpcMainInvokeEvent, token: string, category: any) => {
    try {
        await verifyToken(event, token);
        const result = await CategoryDatabaseOperations.createCategory(category);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error creating category:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}
export const getCategories = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        await verifyToken(event, token);
        const result = await CategoryDatabaseOperations.getCategories();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error getting categories:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}
export const deleteCategory=async (event: IpcMainInvokeEvent, token: string, id: string) => {
    try {
        await verifyToken(event, token);
        const result = await CategoryDatabaseOperations.deleteCategory(id);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error(`Error deleting category ${id}:`, error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}
export const updateCategory=async (event: IpcMainInvokeEvent, token: string, id: string, updates: any) => {
    try {
        await verifyToken(event, token);
        const result = await CategoryDatabaseOperations.updateCategory(id, updates);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error(`Error updating category ${id}:`, error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}