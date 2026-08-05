import { db } from "../../database/index.js";

/**
 * Upsert a sub-category on the VPS.
 * Called after create and update in the categories handler.
 */
export async function syncSubCategoryToVPS(subCategoryId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const sub = await db("sub_categories").where({ id: subCategoryId }).first();
        if (!sub) return;

        const response = await fetch(`${vpsUrl}/api/v1/menu/subcategories/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.DRIVER_SYNC_SECRET || ""}`,
            },
            body: JSON.stringify({
                id: sub.id,
                name: sub.name,
                color: sub.color || "green",
                categoryId: sub.categoryId,
                imgUrl: sub.imgUrl || "",
                priority: sub.priority ?? 0,
            }),
        });

        if (!response.ok) {
            console.error(`SyncManager [subcategories]: Failed to sync sub-category ${subCategoryId}: ${response.statusText}`);
        } else {
            console.log(`SyncManager [subcategories]: Synced sub-category ${subCategoryId} to VPS`);
        }
    } catch (err) {
        console.error(`SyncManager [subcategories]: Error syncing sub-category ${subCategoryId}:`, err);
    }
}

/**
 * Delete a sub-category from the VPS.
 * Called before or after delete in the categories handler.
 */
export async function deleteSubCategoryFromVPS(subCategoryId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const response = await fetch(`${vpsUrl}/api/v1/menu/subcategories/${subCategoryId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${process.env.DRIVER_SYNC_SECRET || ""}`,
            },
        });

        if (!response.ok) {
            console.error(`SyncManager [subcategories]: Failed to delete sub-category ${subCategoryId} from VPS: ${response.statusText}`);
        } else {
            console.log(`SyncManager [subcategories]: Deleted sub-category ${subCategoryId} from VPS`);
        }
    } catch (err) {
        console.error(`SyncManager [subcategories]: Error deleting sub-category ${subCategoryId} from VPS:`, err);
    }
}
