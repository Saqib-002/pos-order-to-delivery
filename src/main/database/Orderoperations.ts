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
                .where("orderId", order.id)
                .andWhere("isDeleted", false);
            const existingItemsMap = new Map();
            existingItems.forEach((item) => {
                const key = `${item.menuItemId}-${item.customIngredients || ""}`;
                existingItemsMap.set(key, item);
            });
            const processedKeys=new Set();
            for (const item of order.items) {
                const menuItem = await trx("menu_items")
                    .where("id", item.id)
                    .andWhere("isDeleted", false)
                    .first();
                if (!menuItem) {
                    Logger.error("Menu item not found:", item.id);
                    continue;
                }
                const key = `${item.id}-${item.ingredients?.join(",") || ""}`;
                const existingItem = existingItemsMap.get(key);
                if (existingItem) {
                    await trx("order_items").where("id", existingItem.id).update({
                        quantity: item.quantity,
                        specialInstructions: item.specialInstructions || "",
                        updatedAt: now,
                        syncedAt: null,
                    });
                    processedKeys.add(key);
                }else{
                    const orderItem={
                        id:randomUUID(),
                        orderId:order.id,
                        menuItemId:item.id,
                        quantity:item.quantity,
                        customIngredients:item.ingredients?.join(","),
                        createdAt:now,
                        updatedAt:now,
                    }
                    await trx("order_items").insert(orderItem)
                }
            }
            for (const [key,existingItem] of existingItemsMap){
                if(!processedKeys.has(key)){
                    await trx("order_items").where("id",existingItem.id).update({
                        isDeleted:true,
                        updatedAt:now,
                    })
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
