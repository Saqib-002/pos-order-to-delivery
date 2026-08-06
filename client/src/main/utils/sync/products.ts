import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a product upsert to the VPS.
 */
export async function syncProductToVPS(productId: string): Promise<void> {
    try {
        const product = await db("products").where({ id: productId }).first();
        if (!product) return;

        enqueue("product", "upsert", {
            id: product.id,
            name: product.name,
            price: product.price,
            priority: product.priority,
            discount: product.discount,
            tax: product.tax,
            description: product.description || "",
            imgUrl: product.imgUrl || "",
            isAvailable: product.isAvailable === undefined ? true : !!product.isAvailable,
            isByWeight: !!product.isByWeight,
            isDrink: !!product.isDrink,
            isOutOfStock: !!product.isOutOfStock,
            isPerDiner: !!product.isPerDiner,
            isPlus18: !!product.isPlus18,
            isOutstanding: !!product.isOutstanding,
            isForMenu: !!product.isForMenu,
            subcategoryId: product.subcategoryId,
        });
    } catch (err) {
        Logger.error(`SyncManager [products]: error queuing upsert for product ${productId}:`, err);
    }
}

/**
 * Enqueue a product delete to the VPS.
 */
export function deleteProductFromVPS(productId: string): void {
    try {
        enqueue("product", "delete", { id: productId });
    } catch (err) {
        Logger.error(`SyncManager [products]: error queuing delete for product ${productId}:`, err);
    }
}

/**
 * Query existing product-variant and product-group links for a product
 * and enqueue delete jobs for them (called before updating a product).
 */
export async function deleteProductAssociationsFromVPS(productId: string): Promise<void> {
    try {
        const oldVariants = await db("products_variants").where({ productId }).select("id");
        const oldGroups = await db("products_groups").where({ productId }).select("id");

        for (const row of oldVariants) {
            enqueue("productvariant", "delete", { id: row.id });
        }
        for (const row of oldGroups) {
            enqueue("productgroup", "delete", { id: row.id });
        }
    } catch (err) {
        Logger.error(`SyncManager [products]: error queuing association deletes for product ${productId}:`, err);
    }
}

/**
 * Query current product-variant and product-group links and enqueue upserts
 * (called after creating/updating a product).
 */
export async function syncProductAssociationsToVPS(productId: string): Promise<void> {
    try {
        const variants = await db("products_variants").where({ productId });
        const groups = await db("products_groups").where({ productId });

        for (const row of variants) {
            enqueue("productvariant", "upsert", {
                id: row.id,
                price: row.price,
                variantId: row.variantId,
                productId: row.productId,
            });
        }
        for (const row of groups) {
            enqueue("productgroup", "upsert", {
                id: row.id,
                freeAddons: row.freeAddons,
                maxComplements: row.maxComplements,
                minComplements: row.minComplements,
                pageNo: row.pageNo,
                groupId: row.groupId,
                productId: row.productId,
                dependsOnGroupId: row.dependsOnGroupId || null,
                dependsOnItemIds: row.dependsOnItemIds || null,
            });
        }
    } catch (err) {
        Logger.error(`SyncManager [products]: error queuing association upserts for product ${productId}:`, err);
    }
}
