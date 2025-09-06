import Logger from "electron-log";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";

export const saveOrder = async (event: IpcMainInvokeEvent,token:string, order: Order) => {
    try {
        const result = await OrderDatabaseOperations.saveOrder(order);
        return {
            status:true,
            data:result
        }
    } catch (error) {
        Logger.error("Error saving order:", error);
        return {
            status:false,
            error:(error as Error).message
        }
    }
};

export const deleteOrder = async (event: IpcMainInvokeEvent,token:string, id: string) => {
    try {
        const result = await OrderDatabaseOperations.deleteOrder(id);
        Logger.info(`Order ${id} deleted successfully`);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        Logger.error(`Error deleting order ${id}:`, error);
        return {
            status:false,
            error:(error as Error).message
        };
    }
};

export const getOrders = async (event: IpcMainInvokeEvent,token:string) => {
    try {
        const res= await OrderDatabaseOperations.getOrders();
        return {
            status:true,
            data:res
        }
    } catch (error) {
        Logger.error("Error getting orders:", error);
        return {
            status:false,
            error:(error as Error).message
        }
    }
};

export const updateOrder = async (event: IpcMainInvokeEvent,token:string, order: Order) => {
    try {
        const result = await OrderDatabaseOperations.updateOrder(order);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        Logger.error("Error updating order:", error);
        return {
            status:false,
            error:(error as Error).message
        }
    }
};

export const getOrderById = async (event: IpcMainInvokeEvent,token:string, id: string) => {
    try {
        Logger.info("Getting order by id:", id);
        const res=await OrderDatabaseOperations.getOrderById(id);
        return{
            status:true,
            data:res
        }
    } catch (error) {
        Logger.error("Error getting order by id:", error);
        return {
            status:false,
            error:(error as Error).message
        }
    }
};