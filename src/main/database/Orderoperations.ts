import { localDb } from "./index.js";
import { Order } from "@/types/order.js";
import Logger from "electron-log";

export class OrderDatabaseOperations {
    static async saveOrder(order: Order): Promise<any> {
        try {
            const now = new Date().toISOString();

            if (!order.id || !order.createdAt) {
                order.id = `orders:${now}`;
                order.createdAt = now;
            }

            if (!order.orderId) {
                const day = order.createdAt.split("T")[0];
                const dailyOrders = await localDb("orders")
                    .whereRaw("DATE(createdAt) = ?", [day])
                    .count("* as count");
                order.orderId = (Number(dailyOrders[0]?.count) || 0) + 1;
            }

            order.updatedAt = now;

            const result = await localDb("orders").insert({
                id: order.id,
                orderId: order.orderId,
                customerName: order.customer.name,
                customerPhone: order.customer.phone,
                customerAddress: order.customer.address,
                items: JSON.stringify(order.items),
                status: order.status,
                deliveryPerson: order.deliveryPerson,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            });
            return { id: order.id };
        } catch (error) {
            Logger.error("Error saving order:", error);
            throw error;
        }
    }

    static async getOrders(): Promise<Order[]> {
        try {
            const rows = await localDb("orders")
                .where("isDeleted", false)
                .orderBy("createdAt", "desc");

            return rows.map((row) => ({
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
            }));
        } catch (error) {
            Logger.error("Error getting orders:", error);
            throw error;
        }
    }

    static async updateOrder(order: Order): Promise<any> {
        try {
            const now = new Date().toISOString();

            await localDb("orders")
                .where("id", order.id)
                .update({
                    orderId: order.orderId,
                    customerName: order.customer.name,
                    customerPhone: order.customer.phone,
                    customerAddress: order.customer.address,
                    items: JSON.stringify(order.items),
                    status: order.status,
                    deliveryPerson: order.deliveryPerson,
                    updatedAt: now,
                    syncedAt: null,
                });

            return { id: order.id };
        } catch (error) {
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
