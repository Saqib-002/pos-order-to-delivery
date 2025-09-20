import { IpcMainInvokeEvent } from "electron";
import { ProductsDatabaseOperations } from "../database/productsOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

export const createProduct = async (
    event: IpcMainInvokeEvent,
    token: string,
    productData: any,
    variantPrices: any,
    addonPages: any
) => {
    try {
        await verifyToken(event, token);
        const result = await ProductsDatabaseOperations.createProduct(
            productData,
            variantPrices,
            addonPages
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error creating order:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getProducts = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        await verifyToken(event, token);
        const result = await ProductsDatabaseOperations.getProducts();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error getting products:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const updateProduct = async (
    event: IpcMainInvokeEvent,
    token: string,
    productData: any,
    variantPrices: any,
    addonPages: any
) => {
    try {
        await verifyToken(event, token);
        const result = await ProductsDatabaseOperations.updateProduct(
            productData,
            variantPrices,
            addonPages
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error updating product:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const deleteProduct = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        await verifyToken(event, token);
        const result = await ProductsDatabaseOperations.deleteProduct(id);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error deleting product:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
