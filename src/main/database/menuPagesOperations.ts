import { db } from "./index.js";
import { MenuPage, MenuPageProduct } from "@/types/menuPages.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class MenuPagesOperations {
    static async createMenuPage(
        menuPage: Omit<MenuPage, "id" | "createdAt" | "updatedAt">,
        products: Omit<MenuPageProduct, "id" | "createdAt" | "updatedAt">[]
    ): Promise<MenuPage> {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            const MenuPageid = randomUUID();
            const newMenuPage = {
                id: MenuPageid,
                ...menuPage,
                createdAt: now,
                updatedAt: now,
                isDeleted: false,
            };
            await trx("menu_pages").insert(newMenuPage);
            const productsToAdd = [];
            for (const product of products) {
                const id = randomUUID();
                const newProduct = {
                    ...product,
                    id,
                    createdAt: now,
                    updatedAt: now,
                    menuPageId: MenuPageid,
                };
                productsToAdd.push(newProduct);
            }
            await trx("menu_page_products").insert(productsToAdd);
            await trx.commit();
            return newMenuPage;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    static async getMenuPages(): Promise<MenuPage[]> {
        try {
            const menuPages = await db("menu_pages")
                .where("isDeleted", false)
                .orderBy("name", "asc");
            return menuPages;
        } catch (error) {
            throw error;
        }
    }

    static async updateMenuPage(
        id: string,
        updates: Partial<MenuPage>,
        products: Partial<MenuPageProduct>[]
    ): Promise<MenuPage> {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            const updatedMenuPage = (await trx("menu_pages")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                })
                .returning("*"))[0] as MenuPage;
            const existingProducts = await trx("menu_page_products")
                .where("menuPageId", id)
                .select("id");
            const providedItemIds = new Set(
                products.map((item) => item.id).filter((id) => id)
            );
            const itemsToDelete = existingProducts.filter(
                (item) => !providedItemIds.has(item.id)
            );
            if (itemsToDelete.length > 0) {
                const itemIdsToDelete = itemsToDelete.map((item) => item.id);
                await trx("menu_page_products")
                    .whereIn("id", itemIdsToDelete)
                    .delete();
            }
            for (const product of products) {
                const existingProduct = await trx("menu_page_products")
                    .where("productId", product.productId)
                    .andWhere("menuPageId", id)
                    .first();
                if (existingProduct) {
                    await trx("menu_page_products")
                        .where("id", existingProduct.id)
                        .update({
                            ...product,
                            updatedAt: now,
                        });
                } else {
                    const productId = randomUUID();
                    const newProduct = {
                        ...product,
                        id:productId,
                        createdAt: now,
                        updatedAt: now,
                        menuPageId: id,
                    };
                    await trx("menu_page_products").insert(newProduct);
                }
            }
            await trx.commit();
            return updatedMenuPage;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    static async deleteMenuPage(id: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            await db("menu_pages").where("id", id).update({
                isDeleted: true,
                updatedAt: now,
            });
            Logger.info(`Menu page deleted: ${id}`);
        } catch (error) {
            throw error;
        }
    }


    static async getMenuPageProducts(
        menuPageId: string
    ): Promise<MenuPageProduct[]> {
        try {
            const products = await db("menu_page_products")
                .where("menuPageId", menuPageId)
                .orderBy("priority", "asc");
            return products;
        } catch (error) {
            throw error;
        }
    }
}
