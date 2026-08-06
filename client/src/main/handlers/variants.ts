import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { IpcMainInvokeEvent } from "electron";
import { VariantsDatabaseOperations } from "../database/variantsOperations.js";
import { db } from "../database/index.js";
import {
    syncVariantToVPS,
    deleteVariantFromVPS,
    deleteVariantItemFromVPS,
    syncVariantItemsForVariant,
} from "../utils/sync/index.js";

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
        if (result && result.variant) {
            syncVariantToVPS(result.variant.id);
            syncVariantItemsForVariant(result.variant.id);
        }
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
        deleteVariantFromVPS(id);
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
        
        // Find deleted variant items before update commits
        if (variantData && variantData.id) {
            const existingItems = await db("variant_items").where({ variantId: variantData.id }).select("id");
            const providedIds = new Set(variantItems.map((item: any) => item.id).filter((id: any) => id));
            const deletedItems = existingItems.filter(item => !providedIds.has(item.id));
            for (const item of deletedItems) {
                deleteVariantItemFromVPS(item.id);
            }
        }

        const result = await VariantsDatabaseOperations.updateVariant(
            variantData,
            variantItems
        );

        if (variantData && variantData.id) {
            syncVariantToVPS(variantData.id);
            syncVariantItemsForVariant(variantData.id);
        }

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
export const getAssociatedProductsByVariantId = async (
    event: IpcMainInvokeEvent,
    token: string,
    variantId: string
) => {
    try {
        await verifyToken(event, token);
        const result = await VariantsDatabaseOperations.getAssociatedProductsByVariantId(
            variantId
        );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error(`Error getting associated products for variant ${variantId}:`, error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};