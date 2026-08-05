import { db } from "../../database/index.js";

/**
 * Upsert a category on the VPS.
 * Called after create and update in the categories handler.
 */
export async function syncCategoryToVPS(categoryId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const category = await db("categories").where({ id: categoryId }).first();
        if (!category) return;
        const response = await fetch(`${vpsUrl}/api/v1/menu/categories/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.DRIVER_SYNC_SECRET || ""}`,
            },
            body: JSON.stringify({
                id: category.id,
                categoryName: category.categoryName,
                color: category.color || "green",
                imgUrl: category.imgUrl || "",
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            console.error(`SyncManager [categories]: Failed to sync ${categoryId} — ${response.status} ${response.statusText} — URL: ${`${vpsUrl}/api/v1/menu/categories/sync`} — Body: ${body}`);
            // console.error(`SyncManager [categories]: Failed to sync category ${categoryId}: ${response.statusText}`);
        } else {
            console.log(`SyncManager [categories]: Synced category ${categoryId} to VPS`);
        }
    } catch (err) {
        console.error(`SyncManager [categories]: Error syncing category ${categoryId}:`, err);
    }
}

/**
 * Delete a category from the VPS.
 * Called before or after delete in the categories handler.
 * Sub-categories are removed automatically via CASCADE on the VPS.
 */
export async function deleteCategoryFromVPS(categoryId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const response = await fetch(`${vpsUrl}/api/v1/menu/categories/${categoryId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${process.env.DRIVER_SYNC_SECRET || ""}`,
            },
        });

        if (!response.ok) {
            console.error(`SyncManager [categories]: Failed to delete category ${categoryId} from VPS: ${response.statusText}`);
        } else {
            console.log(`SyncManager [categories]: Deleted category ${categoryId} from VPS`);
        }
    } catch (err) {
        console.error(`SyncManager [categories]: Error deleting category ${categoryId} from VPS:`, err);
    }
}
