import Logger from "electron-log";
import { db } from "../db.js";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";

export const saveOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        if (!order._id || !order.createdAt) {
            const now = new Date().toISOString();
            order._id = `orders:${now}`;
            order.createdAt = now;
        } else if (!order._id.startsWith("orders:")) {
            throw new Error(
                'Order _id must start with "orders:" for the orders partition'
            );
        }

        if (!order.orderId) {
            const day = order.createdAt.split("T")[0];
            const startkey = `orders:${day}T00:00:00.000Z`;
            const endkey = `orders:${day}T23:59:59.999Z\uffff`;

            const result = await db.allDocs({
                partition: "orders",
                startkey,
                endkey,
            }as PouchDB.Core.AllDocsOptions & { partition?: string });
            order.orderId = result.rows.length + 1;
        }

        const response = await db.post(order);
        return response;
    } catch (error) {
        Logger.error("Error saving order:", error);
        throw error;
    }
};

export const deleteOrder = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        if (!id.startsWith('orders:')) {
            throw new Error('Invalid order _id: must start with "orders:"');
        }
        const order = await db.get(id);
        const response = await db.remove(id, order._rev);
        Logger.info(`Order ${id} deleted successfully`);
        return response;
    } catch (error) {
        Logger.error(`Error deleting order ${id}:`, error);
        throw error;
    }
};

export const getOrders = async () => {
    try {
        const { rows } = await db.allDocs({
            include_docs: true,
            partition: "orders",
        } as PouchDB.Core.AllDocsOptions & { partition?: string });
        return rows.map((row) => row.doc);
    } catch (error) {
        Logger.error("Error getting orders:", error);
        throw error;
    }
};

export const updateOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        if (!order._id.startsWith('orders:')) {
            throw new Error('Invalid order _id: must start with "orders:"');
        }
        return await db.put(order);
    } catch (error) {
        Logger.error("Error updating order:", error);
        throw error;
    }
};
export const getOrderById = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        if (!id.startsWith('orders:')) {
            throw new Error('Invalid order _id: must start with "orders:"');
        }
        Logger.info("Getting order by id:", id);
        Logger.info("Getting order by id:", id);
        return await db.get(id);
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        throw error;
    }
};
