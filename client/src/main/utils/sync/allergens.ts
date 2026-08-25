import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue an allergen upsert to the VPS.
 * Called after create and update in allergenOperations.
 */
export async function syncAllergenToVPS(allergenId: string): Promise<void> {
    try {
        const allergen = await db("allergens").where({ id: allergenId }).first();
        if (!allergen) return;

        enqueue("allergen", "upsert", {
            id: allergen.id,
            nameEs: allergen.nameEs,
            nameEn: allergen.nameEn || "",
            icon: allergen.icon || "",
        });
    } catch (err) {
        Logger.error(`SyncManager [allergens]: error queuing upsert for ${allergenId}:`, err);
    }
}

/**
 * Enqueue an allergen delete to the VPS.
 * Called after delete in allergenOperations.
 */
export function deleteAllergenFromVPS(allergenId: string): void {
    try {
        enqueue("allergen", "delete", { id: allergenId });
    } catch (err) {
        Logger.error(`SyncManager [allergens]: error queuing delete for ${allergenId}:`, err);
    }
}

/**
 * Enqueue product allergens sync to the VPS.
 * Called after product allergens update in productAllergenOperations.
 */
export async function syncProductAllergensToVPS(productId: string): Promise<void> {
    try {
        const rows = await db("products_allergens").where({ productId }).select("allergenId", "type");
        
        for (const r of rows) {
            if (r.allergenId) {
                await syncAllergenToVPS(r.allergenId);
            }
        }

        const allergens = rows.map((r: any) => ({
            allergenId: r.allergenId,
            type: r.type || "contains",
        }));
        const allergenIds = rows.map((r: any) => r.allergenId);

        enqueue("product_allergen", "upsert", {
            productId,
            allergens,
            allergenIds,
        });
    } catch (err) {
        Logger.error(`SyncManager [allergens]: error queuing product allergens for ${productId}:`, err);
    }
}

