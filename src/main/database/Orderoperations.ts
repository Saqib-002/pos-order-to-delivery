import { OrderItem } from "@/types/Menu.js";
import { localDb } from "./index.js";
import { Order } from "@/types/order.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class OrderDatabaseOperations {
    static async saveOrder(order: Order): Promise<any> {
        const trx = await localDb.transaction();
        try {
            const now = new Date().toISOString();
            order.id = randomUUID();
            order.createdAt = now;
            if (!order.orderId) {
                const day = order.createdAt.split("T")[0];
                const dailyOrders = await trx("orders")
                    .whereRaw("DATE(createdAt) = ?", [day])
                    .andWhere("isDeleted", false)
                    .count("* as count");
                order.orderId = (Number(dailyOrders[0]?.count) || 0) + 1;
            }
            order.updatedAt = now;
            const newOrder = {
                id: order.id,
                orderId: order.orderId,
                customerName: order.customer.name,
                customerPhone: order.customer.phone,
                customerAddress: order.customer.address,
                status: order.status,
                deliveryPerson: order.deliveryPerson,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                notes: order.notes,
            };
            await trx("orders").insert(newOrder);
            for (const item of order.items) {
                const menuItem = await trx("menu_items")
                    .where("id", item.id)
                    .andWhere("isDeleted", false)
                    .first();
                const orderItem = {
                    id: randomUUID(),
                    orderId: newOrder.id,
                    menuItemId: item.id,
                    quantity: item.quantity,
                    customIngredients:
                        menuItem.ingredients !== item.ingredients?.join(",")
                            ? item.ingredients?.join(",")
                            : "",
                    specialInstructions: item.specialInstructions || "",
                    createdAt: now,
                    updatedAt: now,
                };
                await trx("order_items").insert(orderItem);
            }
            trx.commit();
            return order;
        } catch (error) {
            await trx.rollback();
            Logger.error("Error saving order:", error);
            throw error;
        }
    }

    static async getOrders(): Promise<Order[]> {
        try {
            const rows = await localDb("orders")
                .where("isDeleted", false)
                .orderBy("createdAt", "desc");
            const orders: Order[] = rows.map((row) => ({
                id: row.id,
                orderId: row.orderId,
                customer: {
                    name: row.customerName,
                    phone: row.customerPhone,
                    address: row.customerAddress,
                },
                items: [],
                status: row.status,
                deliveryPerson: row.deliveryPerson,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            }));
            for (const order of orders) {
                const items = await localDb("order_items")
                    .innerJoin(
                        "menu_items",
                        "order_items.menuItemId",
                        "menu_items.id"
                    )
                    .where("order_items.orderId", order.id)
                    .andWhere("order_items.isDeleted", false)
                    .andWhere("menu_items.isDeleted", false);
                order.items = items.map((item) => ({
                    id: item.menuItemId,
                    name: item.name,
                    category: item.category,
                    ingredients:
                        item.customIngredients === ""
                            ? item.ingredients?.split(",")
                            : item.customIngredients?.split(","),
                    quantity: item.quantity,
                    price: item.price,
                    specialInstructions: item.specialInstructions || "",
                }));
            }
            return orders;
        } catch (error) {
            Logger.error("Error getting orders:", error);
            throw error;
        }
    }

    static async updateOrder(order: Order): Promise<any> {
        const trx = await localDb.transaction();
        try {
            const now = new Date().toISOString();

            await trx("orders").where("id", order.id).update({
                orderId: order.orderId,
                customerName: order.customer.name,
                customerPhone: order.customer.phone,
                customerAddress: order.customer.address,
                status: order.status,
                deliveryPerson: order.deliveryPerson,
                updatedAt: now,
                syncedAt: null,
            });
            const existingItems = await trx("order_items")
                .innerJoin(
                    "menu_items",
                    "order_items.menuItemId",
                    "menu_items.id"
                )
                .where("order_items.orderId", order.id)
                .andWhere("order_items.isDeleted", false)
                .andWhere("menu_items.isDeleted", false)
                .select(
                    "order_items.id as orderItemId",
                    "order_items.menuItemId",
                    "order_items.quantity",
                    "order_items.customIngredients",
                    "order_items.specialInstructions",
                    "menu_items.id as menuId",
                    "menu_items.name",
                    "menu_items.ingredients",
                    "menu_items.price",
                    "menu_items.category"
                );
            const incomingItemIds = new Set(order.items.map((item) => item.id));
            // Mark items not in the incoming list as deleted
            for (const existingItem of existingItems) {
                const isExcluded = !incomingItemIds.has(
                    existingItem.menuItemId
                );
                const haveSameIngredients = order.items.some(
                    (i) =>
                        i.ingredients?.join(",") ===
                            existingItem.customIngredients ||
                        i.ingredients?.join(",") === existingItem.ingredients
                );
                if (isExcluded && !haveSameIngredients) {
                    await trx("order_items")
                        .where("id", existingItem.orderItemId)
                        .update({
                            isDeleted: true,
                            updatedAt: now,
                        });
                }
            }
            for (const item of order.items) {
                const existingItem = existingItems.find(
                    (ei) => ei.menuItemId === item.id
                );
                const menuItem = await trx("menu_items")
                    .where("id", item.id)
                    .andWhere("isDeleted", false)
                    .first();
                const haveSameIngredients =
                    menuItem.ingredients === item.ingredients?.join(",") ||
                    existingItems.some(
                        (ei) =>
                            ei.customIngredients === item.ingredients?.join(",")
                    );
                if (existingItem && haveSameIngredients) {
                    // Update existing item
                    await trx("order_items")
                        .where("id", existingItem.orderItemId)
                        .update({
                            quantity: item.quantity,
                            specialInstructions: item.specialInstructions || "",
                            customIngredients:
                                menuItem.ingredients !==
                                item.ingredients?.join(",")
                                    ? item.ingredients?.join(",")
                                    : "",
                            updatedAt: now,
                            isDeleted: false,
                        });
                } else {
                    // Insert new item
                    const orderItem = {
                        id: randomUUID(),
                        orderId: order.id,
                        menuItemId: item.id,
                        customIngredients:
                            menuItem.ingredients !== item.ingredients?.join(",")
                                ? item.ingredients?.join(",")
                                : "",
                        quantity: item.quantity,
                        specialInstructions: item.specialInstructions || "",
                        createdAt: now,
                        updatedAt: now,
                    };
                    await trx("order_items").insert(orderItem);
                }
            }
            await trx.commit();
            return order;
        } catch (error) {
            await trx.rollback();
            Logger.error("Error updating order:", error);
            throw error;
        }
    }

    static async deleteOrder(id: string): Promise<any> {
        try {
            const now = new Date().toISOString();
            await localDb("orders").where("id", id).update({
                isDeleted: true,
                updatedAt: now,
                syncedAt: null,
            });

            return { id };
        } catch (error) {
            Logger.error("Error deleting order:", error);
            throw error;
        }
    }

    static async getOrderById(id: string): Promise<Order | null> {
        try {
            const row = await localDb("orders")
                .where("id", id)
                .andWhere("isDeleted", false)
                .first();

            if (!row) return null;

            return {
                id: row.id,
                orderId: row.orderId,
                customer: {
                    name: row.customerName,
                    phone: row.customerPhone,
                    address: row.customerAddress,
                },
                items: JSON.parse(row.items),
                status: row.status,
                deliveryPerson: row.deliveryPerson,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            };
        } catch (error) {
            Logger.error("Error getting order by id:", error);
            throw error;
        }
    }
}
