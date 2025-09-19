import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { IpcMainInvokeEvent } from "electron";
import { VariantsDatabaseOperations } from "../database/variantsOperations.js";

export const createVariant = async (
    event: IpcMainInvokeEvent,
    token: string,
    variantData: any,
    variantItems: any
) => {
    try {
        await verifyToken(event, token);
        const result = await VariantsDatabaseOperations.createVariant(
            variantData,
            variantItems
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error creating variant:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getVariants = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        await verifyToken(event, token);
        const result = await VariantsDatabaseOperations.getVariants();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error getting variants:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const deleteVariant = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string
) => {
    try {
        await verifyToken(event, token);
        const result = await VariantsDatabaseOperations.deleteVariant(id);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error(`Error deleting variant ${id}:`, error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const updateVariant = async (
    event: IpcMainInvokeEvent,
    token: string,
    variantData: any,
    variantItems: any
) => {
    try {
        await verifyToken(event, token);
        const result = await VariantsDatabaseOperations.updateVariant(
            variantData,
            variantItems
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error(`Error updating variant ${variantData.id}:`, error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
