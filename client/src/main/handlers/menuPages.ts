import { ipcMain, IpcMainInvokeEvent } from "electron";
import { MenuPagesOperations } from "../database/menuPagesOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { MenuPage, MenuPageProduct } from "@/types/menuPages.js";

export const createMenuPage = async (
    event: IpcMainInvokeEvent,
    token: string,
    menuPage: Omit<MenuPage, "id" | "createdAt" | "updatedAt">,
    products: Omit<MenuPageProduct, "id" | "createdAt" | "updatedAt">[]
) => {
    try {
        await verifyToken(event, token);
        const result = await MenuPagesOperations.createMenuPage(
            menuPage,
            products
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getMenuPages = async (
    event: IpcMainInvokeEvent,
    token: string
) => {
    try {
        await verifyToken(event, token);
        const result = await MenuPagesOperations.getMenuPages();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const updateMenuPage = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string,
    menuPage: Omit<MenuPage, "id" | "createdAt" | "updatedAt">,
    products: Omit<MenuPageProduct, "id" | "createdAt" | "updatedAt">[]
) => {
    try {
        await verifyToken(event, token);
        const result = await MenuPagesOperations.updateMenuPage(
            id,
            menuPage,
            products
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const deleteMenuPage = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        await verifyToken(event, token);
        await MenuPagesOperations.deleteMenuPage(id);
        return {
            status: true,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getMenuPageProducts = async (
    event: IpcMainInvokeEvent,
    token: string,
    menuPageId: string
) => {
    try {
        await verifyToken(event, token);
        const result =
            await MenuPagesOperations.getMenuPageProducts(menuPageId);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getAssociatedMenuByMenuPageId = async (
    event: IpcMainInvokeEvent,
    token: string,
    menuPageId: string
) => {
    try {
        await verifyToken(event, token);
        const res =
            await MenuPagesOperations.getAssociatedMenuByMenuPageId(menuPageId);
        return { status: true, data: res };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
