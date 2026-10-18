import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import { syncLogger as Logger } from "../logger.js";
import { syncProductAllergensToVPS } from "./allergens.js";

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
/**
 * Query existing product-variant, product-group, and printer links for a product
 * and enqueue delete jobs for any that have been removed.
 * If new state parameters are omitted (e.g. on full product delete), deletes all.
 */
export async function deleteProductAssociationsFromVPS(
    productId: string,
    variantPrices?: any,
    addonPages?: any,
    printerIds?: string[]
): Promise<void> {
    try {
        const oldVariants = await db("products_variants").where({ productId }).select("id", "variantId");
        const oldGroups = await db("products_groups").where({ productId }).select("id", "groupId", "pageNo");
        const oldPrinters = await db("printers_products").where({ productId }).select("id", "printerId");

        // 1. Variants to delete
        let variantsToDelete = oldVariants;
        if (variantPrices !== undefined && variantPrices !== null) {
            const currentVariantIds = new Set(Object.keys(variantPrices));
            variantsToDelete = oldVariants.filter((v) => !currentVariantIds.has(v.variantId));
        }
        for (const row of variantsToDelete) {
            enqueue("productvariant", "delete", { id: row.id });
        }

        // 2. Groups to delete
        let groupsToDelete = oldGroups;
        if (addonPages !== undefined && addonPages !== null) {
            const currentGroupKeys = new Set(
                addonPages.map((p: any) => `${p.selectedGroup}_${p.pageNo}`)
            );
            const currentGroupIds = new Set(addonPages.map((p: any) => p.selectedGroup));
            groupsToDelete = oldGroups.filter(
                (g) => !currentGroupKeys.has(`${g.groupId}_${g.pageNo}`) && !currentGroupIds.has(g.groupId)
            );
        }
        for (const row of groupsToDelete) {
            enqueue("productgroup", "delete", { id: row.id });
        }

        // 3. Printers to delete
        let printersToDelete = oldPrinters;
        if (printerIds !== undefined && printerIds !== null) {
            const currentPrinterIds = new Set(printerIds);
            printersToDelete = oldPrinters.filter((p) => !currentPrinterIds.has(p.printerId));
        }
        for (const row of printersToDelete) {
            enqueue("printerproduct", "delete", { id: row.id });
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
        const printers = await db("printers_products").where({ productId });

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
        for (const row of printers) {
            enqueue("printerproduct", "upsert", {
                id: row.id,
                printerId: row.printerId,
                productId: row.productId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            });
        }
        await syncProductAllergensToVPS(productId);
    } catch (err) {
        Logger.error(`SyncManager [products]: error queuing association upserts for product ${productId}:`, err);
    }
}
