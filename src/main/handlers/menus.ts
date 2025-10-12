import { ipcMain, IpcMainInvokeEvent } from "electron";
import { MenusOperations } from "../database/menusOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { Menu, MenuPageAssociation } from "@/types/menuPages.js";
export const getMenus = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        await verifyToken(event, token);
        const menus = await MenusOperations.getMenus();
        return { status: true, data: menus };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
export const getMenusBySubcategory = async (
    event: IpcMainInvokeEvent,
    token: string,
    subcategoryId: string
) => {
    try {
        await verifyToken(event, token);
        const menus =
            await MenusOperations.getMenusBySubcategory(subcategoryId);
        return { status: true, data: menus };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
export const getMenuById = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
)=>{
    try {
        await verifyToken(event, token);
        const menu = await MenusOperations.getMenuById(id);
        return { status: true, data: menu };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export const createMenu = async (
    event: IpcMainInvokeEvent,
    token: string,
    menu: Omit<Menu, "id" | "createdAt" | "updatedAt" | "isDeleted">,
    MenuPageAssociations: Omit<
        MenuPageAssociation,
        "id" | "createdAt" | "updatedAt"
    >[]
) => {
    try {
        await verifyToken(event, token);
        const res = await MenusOperations.createMenu(
            menu,
            MenuPageAssociations
        );
        return { status: true, data: res };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
export const updateMenu = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string,
    updates: Partial<Menu>,
    MenuPageAssociations: Partial<MenuPageAssociation>[]
) => {
    try {
        await verifyToken(event, token);
        const res = await MenusOperations.updateMenu(id, updates, MenuPageAssociations);
        return { status: true, data: res };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
export const deleteMenu = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        await verifyToken(event, token);
        const res = await MenusOperations.deleteMenu(id);
        return { status: true, data: res };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const getMenuPageAssociations = async (
    event: IpcMainInvokeEvent,
    token: string,
    menuId: string
) => {
    try {
        await verifyToken(event, token);
        const res = await MenusOperations.getMenuPageAssociations(menuId);
        return { status: true, data: res };
    } catch (error) {
        return {
            status: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
