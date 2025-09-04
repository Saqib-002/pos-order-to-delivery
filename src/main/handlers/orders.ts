import Logger from "electron-log";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";

export const saveOrder = async (event: IpcMainInvokeEvent, order: Order) => {
    try {
        const result = await OrderDatabaseOperations.saveOrder(order);
        return result;
    } catch (error) {
        Logger.error("Error saving order:", error);
        throw error;
    }
};

export const deleteOrder = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        const result = await OrderDatabaseOperations.deleteOrder(id);
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
        const result = await OrderDatabaseOperations.updateOrder(order);
        return result;
    } catch (error) {
        Logger.error("Error updating order:", error);
        throw error;
    }
};

export const getOrderById = async (event: IpcMainInvokeEvent, id: string) => {
    try {
        Logger.info("Getting order by id:", id);
        return await OrderDatabaseOperations.getOrderById(id);
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        throw error;
    }
};