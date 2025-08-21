import Logger from "electron-log";
import { db } from "../db.js";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";

export const saveOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        if (!order._id || !order.createdAt) {
            const now = new Date().toISOString();
            order._id = now;
            order.createdAt = now;
        }

        if (!order.orderId) {
            const day = order.createdAt.split("T")[0];
            const startkey = `${day}T00:00:00.000Z`;
            const endkey = `${day}T23:59:59.999Z\uffff`;

            const result = await db.allDocs({ startkey, endkey }); // No include_docs for count only
            order.orderId = result.rows.length + 1;
        }

        const response = await db.post(order);
        return response;
    } catch (error) {
        Logger.error("Error saving order:", error);
        throw error;
    }
};
export const getOrders = async () => {
    try {
        const { rows } = await db.allDocs({ include_docs: true });
        return rows.map((row) => row.doc);
    } catch (error) {
        Logger.error("Error getting orders:", error);
        throw error;
    }
};

export const updateOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        return await db.put(order);
    } catch (error) {
        Logger.error("Error updating order:", error);
        throw error;
    }
};
export const getOrderById = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        Logger.info("Getting order by id:", id);
        Logger.info("Getting order by id:", id);
        return await db.get(id);
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        throw error;
    }
};
