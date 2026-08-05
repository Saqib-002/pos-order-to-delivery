import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a sub-category upsert to the VPS.
 * Called after create and update in the categories handler.
 * Returns immediately — the queue processor handles the actual HTTP call.
 */
export async function syncSubCategoryToVPS(subCategoryId: string): Promise<void> {
    try {
        const sub = await db("sub_categories").where({ id: subCategoryId }).first();
        if (!sub) return;

        enqueue("subcategory", "upsert", {
            id: sub.id,
            name: sub.name,
            color: sub.color || "green",
            categoryId: sub.categoryId,
            imgUrl: sub.imgUrl || "",
            priority: sub.priority ?? 0,
        });
    } catch (err) {
        Logger.error(`SyncManager [subcategories]: error queuing upsert for ${subCategoryId}:`, err);
    }
}

/**
 * Enqueue a sub-category delete to the VPS.
 * Called before delete in the categories handler.
 */
export function deleteSubCategoryFromVPS(subCategoryId: string): void {
    try {
        enqueue("subcategory", "delete", { id: subCategoryId });
    } catch (err) {
        Logger.error(`SyncManager [subcategories]: error queuing delete for ${subCategoryId}:`, err);
    }
}
