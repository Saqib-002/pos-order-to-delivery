import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a variant upsert to the VPS.
 */
export async function syncVariantToVPS(variantId: string): Promise<void> {
    try {
        const variant = await db("variants").where({ id: variantId }).first();
        if (!variant) return;

        enqueue("variant", "upsert", {
            id: variant.id,
            name: variant.name || "",
            color: variant.color || "green",
        });
    } catch (err) {
        Logger.error(`SyncManager [variants]: error queuing upsert for variant ${variantId}:`, err);
    }
}

/**
 * Enqueue a variant delete to the VPS.
 */
export function deleteVariantFromVPS(variantId: string): void {
    try {
        enqueue("variant", "delete", { id: variantId });
    } catch (err) {
        Logger.error(`SyncManager [variants]: error queuing delete for variant ${variantId}:`, err);
    }
}

/**
 * Enqueue a variant item upsert to the VPS.
 */
export async function syncVariantItemToVPS(itemId: string): Promise<void> {
    try {
        const item = await db("variant_items").where({ id: itemId }).first();
        if (!item) return;

        enqueue("variantitem", "upsert", {
            id: item.id,
            name: item.name,
            imgUrl: item.imgUrl || "",
            priority: item.priority || 0,
            variantId: item.variantId,
        });
    } catch (err) {
        Logger.error(`SyncManager [variants]: error queuing upsert for variant item ${itemId}:`, err);
    }
}

/**
 * Enqueue a variant item delete to the VPS.
 */
export function deleteVariantItemFromVPS(itemId: string): void {
    try {
        enqueue("variantitem", "delete", { id: itemId });
    } catch (err) {
        Logger.error(`SyncManager [variants]: error queuing delete for variant item ${itemId}:`, err);
    }
}

/**
 * Enqueue all current variant items for a variant to the VPS.
 */
export async function syncVariantItemsForVariant(variantId: string): Promise<void> {
    try {
        const items = await db("variant_items").where({ variantId });
        for (const item of items) {
            enqueue("variantitem", "upsert", {
                id: item.id,
                name: item.name,
                imgUrl: item.imgUrl || "",
                priority: item.priority || 0,
                variantId: item.variantId,
            });
        }
    } catch (err) {
        Logger.error(`SyncManager [variants]: error queuing items upsert for variant ${variantId}:`, err);
    }
}
