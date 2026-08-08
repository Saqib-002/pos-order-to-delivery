import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a menu upsert to the VPS.
 */
export async function syncMenuToVPS(menuId: string): Promise<void> {
    try {
        const menu = await db("menus").where({ id: menuId }).first();
        if (!menu) return;

        enqueue("menu", "upsert", {
            id: menu.id,
            name: menu.name,
            subcategoryId: menu.subcategoryId,
            description: menu.description || "",
            price: Number(menu.price || 0),
            imgUrl: menu.imgUrl || "",
            priority: Number(menu.priority || 0),
            tax: Number(menu.tax || 10),
            discount: Number(menu.discount || 0),
            outstanding: !!menu.outstanding,
        });
    } catch (err) {
        Logger.error(`SyncManager [menus]: error queuing upsert for menu ${menuId}:`, err);
    }
}

/**
 * Enqueue a menu delete to the VPS.
 */
export function deleteMenuFromVPS(menuId: string): void {
    try {
        enqueue("menu", "delete", { id: menuId });
    } catch (err) {
        Logger.error(`SyncManager [menus]: error queuing delete for menu ${menuId}:`, err);
    }
}

/**
 * Enqueue a menu page upsert to the VPS.
 */
export async function syncMenuPageToVPS(pageId: string): Promise<void> {
    try {
        const page = await db("menu_pages").where({ id: pageId }).first();
        if (!page) return;

        enqueue("menupage", "upsert", {
            id: page.id,
            name: page.name,
            description: page.description || "",
        });
    } catch (err) {
        Logger.error(`SyncManager [menus]: error queuing upsert for menu page ${pageId}:`, err);
    }
}

/**
 * Enqueue a menu page delete from the VPS.
 */
export function deleteMenuPageFromVPS(pageId: string): void {
    try {
        enqueue("menupage", "delete", { id: pageId });
    } catch (err) {
        Logger.error(`SyncManager [menus]: error queuing delete for menu page ${pageId}:`, err);
    }
}

/**
 * Sync page products association for a menu page.
 */
export async function syncMenuPageProductsToVPS(pageId: string): Promise<void> {
    try {
        const pageProducts = await db("menu_page_products").where({ menuPageId: pageId });
        for (const row of pageProducts) {
            enqueue("menupageproduct", "upsert", {
                id: row.id,
                menuPageId: row.menuPageId,
                productId: row.productId,
                productName: row.productName,
                supplement: Number(row.supplement || 0),
                priority: Number(row.priority || 0),
            });
        }
    } catch (err) {
        Logger.error(`SyncManager [menus]: error syncing page products for page ${pageId}:`, err);
    }
}

/**
 * Sync menu associations (menu page links) to the VPS.
 */
export async function syncMenuAssociationsToVPS(menuId: string): Promise<void> {
    try {
        const associations = await db("menu_page_associations").where({ menuId });
        for (const row of associations) {
            enqueue("menupageassociation", "upsert", {
                id: row.id,
                menuId: row.menuId,
                menuPageId: row.menuPageId,
                pageName: row.pageName,
                minimum: Number(row.minimum || 1),
                maximum: Number(row.maximum || 1),
                priority: Number(row.priority || 0),
                multiple: row.multiple || "No",
            });
        }
    } catch (err) {
        Logger.error(`SyncManager [menus]: error syncing associations for menu ${menuId}:`, err);
    }
}

/**
 * Delete associations for a menu.
 */
export async function deleteMenuAssociationsFromVPS(menuId: string): Promise<void> {
    try {
        const oldAssoc = await db("menu_page_associations").where({ menuId }).select("id");
        for (const row of oldAssoc) {
            enqueue("menupageassociation", "delete", { id: row.id });
        }
    } catch (err) {
        Logger.error(`SyncManager [menus]: error deleting associations for menu ${menuId}:`, err);
    }
}

/**
 * Delete page products association for a menu page.
 */
export async function deleteMenuPageProductsFromVPS(pageId: string): Promise<void> {
    try {
        const oldAssoc = await db("menu_page_products").where({ menuPageId: pageId }).select("id");
        for (const row of oldAssoc) {
            enqueue("menupageproduct", "delete", { id: row.id });
        }
    } catch (err) {
        Logger.error(`SyncManager [menus]: error deleting page products for page ${pageId}:`, err);
    }
}
