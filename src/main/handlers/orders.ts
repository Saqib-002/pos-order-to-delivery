import Logger from "electron-log";
import { IpcMainInvokeEvent } from "electron";
import { Order } from "@/types/order.js";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";

export const saveOrder = async (event: IpcMainInvokeEvent,token:string,item:any) => {
    try {
        const result = await OrderDatabaseOperations.saveOrder(item);
        return {
            status:true,
            data:result
        }
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        }
    }
};
export const addItemToOrder = async (event: IpcMainInvokeEvent,token:string, orderId: string,item:any) => {
    try {
        const result = await OrderDatabaseOperations.addItemToOrder(orderId,item);
        return {
            status:true,
            data:result
        }
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        }
    }
};
export const removeItemFromOrder = async (event: IpcMainInvokeEvent,token:string, orderId: string,itemId:string) => {
    try {
        const result = await OrderDatabaseOperations.removeItemFromOrder(orderId,itemId);
        return {
            status:true,
            data:result
        }
    }
    catch (error) {
        return {
            status:false,
            error:(error as Error).message
        }
    }
}
export const deleteOrder = async (event: IpcMainInvokeEvent,token:string, id: string) => {
    try {
        const result = await OrderDatabaseOperations.deleteOrder(id);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        };
    }
};
export const updateItemQuantity=async(event: IpcMainInvokeEvent,token:string, itemId:string,quantity:number)=>{
    try {
        const result = await OrderDatabaseOperations.updateItemQuantity(itemId,quantity);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        };
    }
}
export const getOrderItems = async (event: IpcMainInvokeEvent,token:string, orderId: string) => {
    try {
        const result = await OrderDatabaseOperations.getOrderItems(orderId);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        };
    }
};
export const updateOrder = async (event: IpcMainInvokeEvent,token:string, orderId:string,orderData: Partial<Order>) => {
    try {
        const result = await OrderDatabaseOperations.updateOrder(orderId,orderData);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        }
    }
}
export const removeMenuFromOrder = async (event: IpcMainInvokeEvent,token:string, orderId: string,menuId:string,menuSecondaryId:string) => {
    try {
        const result = await OrderDatabaseOperations.removeMenuFromOrder(orderId,menuId,menuSecondaryId);
        return {
            status:true,
            data:result
        }
    }
    catch (error) {
        return {
            status:false,
            error:(error as Error).message
        }
    }
}
export const updateMenuQuantity=async(event: IpcMainInvokeEvent,token:string, orderId:string,menuId:string,menuSecondaryId:string,quantity:number)=>{
    try {
        const result = await OrderDatabaseOperations.updateMenuQuantity(orderId,menuId,menuSecondaryId,quantity);
        return {
            status:true,
            data:result
        };
    } catch (error) {
        return {
            status:false,
            error:(error as Error).message
        };
    }
}
// export const cancelOrder = async (event: IpcMainInvokeEvent,token:string, id: string) => {
//     try {
//         const result = await OrderDatabaseOperations.cancelOrder(id);
//         return {
//             status:true,
//             data:result
//         };
//     } catch (error) {
//         Logger.error(`Error deleting order ${id}:`, error);
//         return {
//             status:false,
//             error:(error as Error).message
//         };
//     }
// };
// export const readyOrder = async (event: IpcMainInvokeEvent,token:string, id: string) => {
//     try {
//         const result = await OrderDatabaseOperations.readyOrder(id);
//         return {
//             status:true,
//             data:result
//         };
//     } catch (error) {
//         Logger.error(`Error deleting order ${id}:`, error);
//         return {
//             status:false,
//             error:(error as Error).message
//         };
//     }
// };
// export const markDeliveredOrder = async (event: IpcMainInvokeEvent,token:string, id: string) => {
//     try {
//         const result = await OrderDatabaseOperations.markDeliveredOrder(id);
//         return {
//             status:true,
//             data:result
//         };
//     } catch (error) {
//         Logger.error(`Error deleting order ${id}:`, error);
//         return {
//             status:false,
//             error:(error as Error).message
//         };
//     }
// };

// export const getOrders = async (event: IpcMainInvokeEvent,token:string) => {
//     try {
//         const res= await OrderDatabaseOperations.getOrders();
//         return {
//             status:true,
//             data:res
//         }
//     } catch (error) {
//         Logger.error("Error getting orders:", error);
//         return {
//             status:false,
//             error:(error as Error).message
//         }
//     }
// };
// export const getOrderAnalytics = async (event: IpcMainInvokeEvent,token:string,filter:any) => {
//     try {
//         const res= await OrderDatabaseOperations.getOrderAnalytics(filter);
//         return {
//             status:true,
//             data:res
//         }
//     } catch (error) {
//         Logger.error("Error getting orders:", error);
//         return {
//             status:false,
//             error:(error as Error).message
//         }
//     }
// };
export const getOrdersByFilter = async (event: IpcMainInvokeEvent,token:string,filter:any) => {
    try {
        const res= await OrderDatabaseOperations.getOrdersByFilter(filter);
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

// export const updateOrder = async (event: IpcMainInvokeEvent,token:string, order: Order) => {
//     try {
//         const result = await OrderDatabaseOperations.updateOrder(order);
//         return {
//             status:true,
//             data:result
//         };
//     } catch (error) {
//         Logger.error("Error updating order:", error);
//         return {
//             status:false,
//             error:(error as Error).message
//         }
//     }
// };
