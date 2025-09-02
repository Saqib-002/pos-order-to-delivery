import Logger from "electron-log";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";
import { syncManager } from "../database/sync.js";

export const saveOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        const result = await OrderDatabaseOperations.saveOrder(order);
        
        // Trigger sync after local save
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        return result;
    } catch (error) {
        Logger.error("Error saving order:", error);
        throw error;
    }
};

export const deleteOrder = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        if (!id.startsWith('orders:')) {
            throw new Error('Invalid order id: must start with "orders:"');
        }
        
        const result = await OrderDatabaseOperations.deleteOrder(id);
        
        // Trigger sync after deletion
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        Logger.info(`Order ${id} deleted successfully`);
        return result;
    } catch (error) {
        Logger.error(`Error deleting order ${id}:`, error);
        throw error;
    }
};

export const getOrders = async () => {
    try {
        return await OrderDatabaseOperations.getOrders();
    } catch (error) {
        Logger.error("Error getting orders:", error);
        throw error;
    }
};

export const updateOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        if (!order.id.startsWith('orders:')) {
            throw new Error('Invalid order id: must start with "orders:"');
        }
        
        const result = await OrderDatabaseOperations.updateOrder(order);
        
        // Trigger sync after update
        setTimeout(() => syncManager.syncWithRemote(), 100);
        
        return result;
    } catch (error) {
        Logger.error("Error updating order:", error);
        throw error;
    }
};

export const getOrderById = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        if (!id.startsWith('orders:')) {
            throw new Error('Invalid order id: must start with "orders:"');
        }
        Logger.info("Getting order by id:", id);
        return await OrderDatabaseOperations.getOrderById(id);
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        throw error;
    }
};