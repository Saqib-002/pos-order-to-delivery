import { randomUUID } from "crypto";
import { db } from "./index.js";

export class ProductsDatabaseOperations {
    static async createProduct(
        productData: any,
        variantPrices: any,
        addonPages: any
    ) {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            const newProduct = {
                ...productData,
                id: randomUUID(),
                createdAt: now,
                updatedAt: now,
            };
            await trx("products").insert(newProduct);
            for (const [variantItemId, price] of Object.entries(
                variantPrices
            )) {
                console.log(variantItemId, price);
                const exists = await trx("products_variants")
                    .where("id",variantItemId)
                    .first();
                if (!exists) {
                    console.error(
                        `Variant with ID ${variantItemId} does not exist`
                    );
                }
                const newVariantPrice = {
                    id: randomUUID(),
                    variantId: variantItemId,
                    productId: newProduct.id,
                    price,
                    createdAt: now,
                    updatedAt: now,
                };
                await trx("products_variants").insert(newVariantPrice);
            }
            const newAddonPages = [];
            for (const addonPage of addonPages) {
                newAddonPages.push({
                    id: randomUUID(),
                    productId: newProduct.id,
                    minComplements: addonPage.minComplements,
                    maxComplements: addonPage.maxComplements,
                    freeAddons: addonPage.freeAddons,
                    groupId: addonPage.selectedGroup,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            await trx("products_groups").insert(newAddonPages);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}
