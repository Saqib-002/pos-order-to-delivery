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
            for (const [index,addonPage] of addonPages.entries()) {
                newAddonPages.push({
                    id: randomUUID(),
                    productId: newProduct.id,
                    pageNo: index + 1,
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
    static async getAllProducts() {
        try {
            let query = db("products")
                .join(
                    "sub_categories",
                    "products.subcategoryId",
                    "=",
                    "sub_categories.id"
                )
                .select("products.*", "sub_categories.categoryId")
                .orderBy("products.name", "asc");
            const products = await query;
            return products;
        } catch (error) {
            throw error;
        }
    }
    static async getProductsByCatId(subcatId:string) {
        try {
            let query = db("products")
                .join(
                    "sub_categories",
                    "products.subcategoryId",
                    "=",
                    "sub_categories.id"
                ).where("sub_categories.categoryId", subcatId)
                .select("products.*", "sub_categories.categoryId")
                .orderBy("products.name", "asc");
            const products = await query;
            return products;
        } catch (error) {
            throw error;
        }
    }
    static async updateProduct(
        productData: any,
        variantPrices: any,
        addonPages: any
    ) {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            await trx("products")
                .where("id", productData.id)
                .update(productData);
            await trx("products_variants")
                .where("productId", productData.id)
                .delete();
            for (const [variantItemId, price] of Object.entries(
                variantPrices
            )) {
                const newVariantPrice = {
                    id: randomUUID(),
                    variantId: variantItemId,
                    productId: productData.id,
                    price,
                    createdAt: now,
                    updatedAt: now,
                };
                await trx("products_variants").insert(newVariantPrice);
            }
            await trx("products_groups")
                .where("productId", productData.id)
                .delete();
            const newAddonPages = [];
            for (const addonPage of addonPages) {
                newAddonPages.push({
                    id: randomUUID(),
                    productId: productData.id,
                    minComplements: addonPage.minComplements,
                    maxComplements: addonPage.maxComplements,
                    freeAddons: addonPage.freeAddons,
                    pageNo: addonPage.pageNo,
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
    static async deleteProduct(id: string) {
        try {
            await db("products").where("id", id).delete();
        } catch (error) {
            throw error;
        }
    }
    static async getVariantsByProductId(productId: string) {
        try {
            const variants = await db("products_variants")
                .join(
                    "variant_items",
                    "products_variants.variantId",
                    "=",
                    "variant_items.id"
                )
                .where("products_variants.productId", productId)
                .select("variant_items.variantId as variantId",
                    "products_variants.price as price",
                    "products_variants.variantId as id"
                )
            return variants;
        } catch (error) {
            throw error;
        }
    }
    static async getAddOnPagesByProductId(productId: string) {
        try {
            const addOnPages = await db("products_groups")
                .where("products_groups.productId", productId)
                .select("products_groups.id as id",
                    "products_groups.freeAddons",
                    "products_groups.pageNo",
                    "products_groups.maxComplements",
                    "products_groups.minComplements",
                    "products_groups.groupId as selectedGroup"
                ).orderBy("products_groups.pageNo", "asc");
            return addOnPages;
        } catch (error) {
            throw error;
        }
    }
}
