import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a category upsert to the VPS.
 * Called after create and update in the categories handler.
 * Returns immediately — the queue processor handles the actual HTTP call.
 */
export async function syncCategoryToVPS(categoryId: string): Promise<void> {
    try {
        const category = await db("categories").where({ id: categoryId }).first();
        if (!category) return;

        enqueue("category", "upsert", {
            id: category.id,
            categoryName: category.categoryName,
            color: category.color || "green",
            imgUrl: category.imgUrl || "",
        });
    } catch (err) {
        Logger.error(`SyncManager [categories]: error queuing upsert for ${categoryId}:`, err);
    }
}

/**
 * Enqueue a category delete to the VPS.
 * Called before delete in the categories handler.
 * Sub-categories are removed automatically via CASCADE on the VPS.
 */
export function deleteCategoryFromVPS(categoryId: string): void {
    try {
        enqueue("category", "delete", { id: categoryId });
    } catch (err) {
        Logger.error(`SyncManager [categories]: error queuing delete for ${categoryId}:`, err);
    }
}
