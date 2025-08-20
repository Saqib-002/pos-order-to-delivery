import Logger from 'electron-log';
import { db } from '../db.js';
import { IpcMainInvokeEvent } from 'electron';
import { Order } from '@/types/order.js';

export const saveOrder = async (event:IpcMainInvokeEvent, order:Order) => {
    try {
        return await db.post(order);
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

export const updateOrder = async (event:IpcMainInvokeEvent, order:Order) => {
    try {
        return await db.put(order);
    } catch (error) {
        Logger.error("Error updating order:", error);
        throw error;
    }
};
export const getOrderById = async (event:IpcMainInvokeEvent, id:string) => {
    try {
        Logger.info("Getting order by id:", id)
        Logger.info("Getting order by id:", id)
        return await db.get(id);
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        throw error;
    }
};
