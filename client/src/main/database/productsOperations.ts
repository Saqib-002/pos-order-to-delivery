import { randomUUID } from "crypto";
import { db } from "./index.js";
import { deleteImg, uploadImg } from "../utils/utils.js";
import dotenv from "dotenv";
dotenv.config();

export class ProductsDatabaseOperations {
    static async createProduct(
        productData: any,
        variantPrices: any,
        addonPages: any,
        printerIds: string[]
    ) {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            if (productData.imgUrl && !productData.imgUrl.startsWith("http")) {
                productData.imgUrl = await uploadImg(productData.imgUrl, false);
            }
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
            for (const [index, addonPage] of addonPages.entries()) {
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
            if (newAddonPages.length > 0) {
                await trx("products_groups").insert(newAddonPages);
            }
            if (printerIds.length > 0) {
                await trx("printers_products").insert(
                    printerIds.map((printerId) => ({
                        id: randomUUID(),
                        printerId,
                        productId: newProduct.id,
                        createdAt: now,
                        updatedAt: now,
                    }))
                );
            }
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
                .orderBy("products.priority", "asc");
            const products = await query;
            return products.map((p: any) => ({
                ...p,
                imgUrl: `${p.imgUrl ? `${process.env.CDN_URL}/uploads/${p.imgUrl}` : ""}`,
            }));
        } catch (error) {
            throw error;
        }
    }
    static async getProductsByCatId(subcatId: string) {
        try {
            let query = db("products")
                .join(
                    "sub_categories",
                    "products.subcategoryId",
                    "=",
                    "sub_categories.id"
                )
                .where("products.subcategoryId", subcatId)
                .select("products.*", "sub_categories.categoryId")
                .orderBy("products.priority", "asc");
            const products = await query;
            const productIds = products.map((p: any) => p.id);
            const allPrinters = await db("printers_products")
                .join(
                    "printers",
                    "printers_products.printerId",
                    "=",
                    "printers.id"
                )
                .whereIn("productId", productIds)
                .select("productId", "printerId", "name", "isMain");
            const printerMap = new Map();
            for (const { productId, printerId, name, isMain } of allPrinters) {
                if (!printerMap.has(productId)) {
                    printerMap.set(productId, []);
                }
                printerMap
                    .get(productId)!
                    .push(`${printerId}|${name}|${isMain}`);
            }
            for (const product of products) {
                const uploadUrl = process.env.CDN_URL;
                product.printerIds = printerMap.get(product.id) || [];
                product.imgUrl = `${product.imgUrl ? `${uploadUrl}/uploads/${product.imgUrl}` : ""}`;
            }
            return products;
        } catch (error) {
            throw error;
        }
    }
    static async updateProduct(
        productData: any,
        variantPrices: any,
        addonPages: any,
        printerIds: string[]
    ) {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            const product = await db("products")
                .where("id", productData.id)
                .first();
            let updateUrl=productData.imgUrl;
            if(updateUrl){
                updateUrl=updateUrl.split("/").at(-1);
            }
            if (product && product.imgUrl && product.imgUrl !== updateUrl) {
                const res=await deleteImg(product.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
            if (productData.imgUrl && !productData.imgUrl.startsWith("http")) {
                productData.imgUrl = await uploadImg(productData.imgUrl, false);
            } else if (productData.imgUrl) {
                productData.imgUrl = productData.imgUrl?.split("/").at(-1);
            }
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
            if (newAddonPages.length > 0) {
                await trx("products_groups").insert(newAddonPages);
            }
            await trx("printers_products")
                .where("productId", productData.id)
                .delete();
            if (printerIds.length > 0) {
                await trx("printers_products").insert(
                    printerIds.map((printerId) => ({
                        id: randomUUID(),
                        printerId,
                        productId: productData.id,
                        createdAt: now,
                        updatedAt: now,
                    }))
                );
            }
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }
    static async deleteProduct(id: string) {
        try {
            const product = await db("products")
                .where("id", id)
                .first();
            if (product && product.imgUrl) {
                const res=await deleteImg(product.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
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
                .select(
                    "variant_items.variantId as variantId",
                    "variant_items.name as name",
                    "variant_items.imgUrl as imgUrl",
                    "products_variants.price as price",
                    "products_variants.variantId as id"
                );
            const uploadUrl = process.env.CDN_URL;
            return variants.map((variant: any) => ({
                ...variant,
                imgUrl: variant.imgUrl
                    ? `${uploadUrl}/uploads/${variant.imgUrl}`
                    : null,
            }));
        } catch (error) {
            throw error;
        }
    }
    static async getAddOnPagesByProductId(productId: string) {
        try {
            const addOnPages = await db("products_groups")
                .where("products_groups.productId", productId)
                .select(
                    "products_groups.id as id",
                    "products_groups.freeAddons",
                    "products_groups.pageNo",
                    "products_groups.maxComplements",
                    "products_groups.minComplements",
                    "products_groups.groupId as selectedGroup"
                )
                .orderBy("products_groups.pageNo", "asc");
            return addOnPages;
        } catch (error) {
            throw error;
        }
    }
    static async getProductById(productId: string) {
        try {
            const product = await db("products")
                .where("id", productId)
                .select("products.*")
                .first();
            const productPrinters = await db("printers_products")
                .join(
                    "printers",
                    "printers_products.printerId",
                    "=",
                    "printers.id"
                )
                .where("productId", productId)
                .select(
                    "printers_products.printerId",
                    "printers.name",
                    "printers.isMain"
                );
            product.printerIds = productPrinters.map(
                (p: any) => `${p.printerId}|${p.name}|${p.isMain}`
            );
            return {
                ...product,
                imgUrl: `${product.imgUrl ? `${process.env.CDN_URL}/uploads/${product.imgUrl}` : ""}`,
            };
        } catch (error) {
            throw error;
        }
    }
    static async getAssociatedMenuPagesByProductId(productId: string) {
        try {
            const product = await db("menu_page_products")
                .where("productId", productId)
                .select("id");
            return product;
        } catch (error) {
            throw error;
        }
    }
}
