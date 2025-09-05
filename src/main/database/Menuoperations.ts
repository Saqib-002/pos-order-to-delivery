import { localDb } from "./index.js";
import { MenuItem, OrderItem } from "@/types/Menu.js";
import Logger from "electron-log";

export class MenuDatabaseOperations {
    // Menu Items CRUD Operations
    static async createMenuItem(menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
        try {
            const now = new Date().toISOString();
            const id = `menu:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const newMenuItem = {
                id,
                ...menuItem,
                createdAt: now,
                updatedAt: now,
            };

            await localDb("menu_items").insert(newMenuItem);
            Logger.info(`Menu item created: ${newMenuItem.name}`);
            return newMenuItem;
        } catch (error) {
            Logger.error("Error creating menu item:", error);
            throw error;
        }
    }

    static async getMenuItems(): Promise<MenuItem[]> {
        try {
            const rows = await localDb("menu_items")
                .where("isDeleted", false)
                .orderBy("category", "asc")
                .orderBy("name", "asc");
            return rows;
        } catch (error) {
            Logger.error("Error getting menu items:", error);
            throw error;
        }
    }

    static async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
        try {
            const rows = await localDb("menu_items")
                .where("category", category)
                .andWhere("isDeleted", false)
                .andWhere("isAvailable", true)
                .orderBy("name", "asc");
            return rows;
        } catch (error) {
            Logger.error(`Error getting menu items for category ${category}:`, error);
            throw error;
        }
    }

    static async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
        try {
            const now = new Date().toISOString();
            
            await localDb("menu_items")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                    syncedAt: null,
                });

            const updatedItem = await localDb("menu_items")
                .where("id", id)
                .first();

            if (!updatedItem) {
                throw new Error("Menu item not found after update");
            }

            Logger.info(`Menu item updated: ${id}`);
            return updatedItem;
        } catch (error) {
            Logger.error("Error updating menu item:", error);
            throw error;
        }
    }

    static async deleteMenuItem(id: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            
            await localDb("menu_items")
                .where("id", id)
                .update({
                    isDeleted: true,
                    updatedAt: now,
                    syncedAt: null,
                });

            Logger.info(`Menu item deleted: ${id}`);
        } catch (error) {
            Logger.error("Error deleting menu item:", error);
            throw error;
        }
    }

    static async getMenuItemById(id: string): Promise<MenuItem | null> {
        try {
            const row = await localDb("menu_items")
                .where("id", id)
                .andWhere("isDeleted", false)
                .first();
            return row || null;
        } catch (error) {
            Logger.error("Error getting menu item by id:", error);
            throw error;
        }
    }

    // Order Items Operations
    static async createOrderItem(orderItem: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderItem> {
        try {
            const now = new Date().toISOString();
            const id = `order_item:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const newOrderItem = {
                id,
                ...orderItem,
                createdAt: now,
                updatedAt: now,
            };

            await localDb("order_items").insert(newOrderItem);
            Logger.info(`Order item created for order: ${orderItem.orderId}`);
            return newOrderItem;
        } catch (error) {
            Logger.error("Error creating order item:", error);
            throw error;
        }
    }

    static async getOrderItems(orderId: string): Promise<OrderItem[]> {
        try {
            const rows = await localDb("order_items")
                .leftJoin("menu_items", "order_items.menuItemId", "menu_items.id")
                .where("order_items.orderId", orderId)
                .andWhere("order_items.isDeleted", false)
                .select(
                    "order_items.*",
                    "menu_items.name as menuItemName",
                    "menu_items.description as menuItemDescription",
                    "menu_items.category as menuItemCategory"
                );

            return rows.map(row => ({
                id: row.id,
                orderId: row.orderId,
                menuItemId: row.menuItemId,
                quantity: row.quantity,
                unitPrice: row.unitPrice,
                specialInstructions: row.specialInstructions,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                syncedAt: row.syncedAt,
                isDeleted: row.isDeleted,
                menuItem: {
                    id: row.menuItemId,
                    name: row.menuItemName,
                    description: row.menuItemDescription,
                    category: row.menuItemCategory,
                } as any
            }));
        } catch (error) {
            Logger.error("Error getting order items:", error);
            throw error;
        }
    }

    static async updateOrderItem(id: string, updates: Partial<OrderItem>): Promise<OrderItem> {
        try {
            const now = new Date().toISOString();
            
            await localDb("order_items")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                    syncedAt: null,
                });

            const updatedItem = await localDb("order_items")
                .where("id", id)
                .first();

            if (!updatedItem) {
                throw new Error("Order item not found after update");
            }

            Logger.info(`Order item updated: ${id}`);
            return updatedItem;
        } catch (error) {
            Logger.error("Error updating order item:", error);
            throw error;
        }
    }

    static async deleteOrderItems(orderId: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            
            await localDb("order_items")
                .where("orderId", orderId)
                .update({
                    isDeleted: true,
                    updatedAt: now,
                    syncedAt: null,
                });

            Logger.info(`Order items deleted for order: ${orderId}`);
        } catch (error) {
            Logger.error("Error deleting order items:", error);
            throw error;
        }
    }

    static async getCategories(): Promise<string[]> {
        try {
            const rows = await localDb("menu_items")
                .distinct("category")
                .where("isDeleted", false)
                .orderBy("category", "asc");
            
            return rows.map(row => row.category);
        } catch (error) {
            Logger.error("Error getting categories:", error);
            throw error;
        }
    }
}