import { IpcMainInvokeEvent } from "electron";
import { DeliveryDatabaseOperations } from "../database/deliveryoperations.js";
import { DeliveryPerson } from "@/types/delivery.js";
import { syncManager } from "../database/sync.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

// Create delivery person
export const createDeliveryPerson = async (
  event: IpcMainInvokeEvent,
  token: string,
  deliveryPersonData: Omit<DeliveryPerson, "id" | "createdAt" | "updatedAt" | "totalDeliveries" | "rating">
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.createDeliveryPerson(deliveryPersonData);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error creating delivery person:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

// Get all delivery persons
export const getDeliveryPersons = async (
  event: IpcMainInvokeEvent,
  token: string,
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.getDeliveryPersons();
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting delivery persons:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const getDeliveryPersonStats = async (
  event: IpcMainInvokeEvent,
  token: string,
  deliveryPersonId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.getDeliveryPersonStats(deliveryPersonId);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting delivery person stats:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};


// Update delivery person
export const updateDeliveryPerson = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  updates: Partial<DeliveryPerson>
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.updateDeliveryPerson(id, updates);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error updating delivery person:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

// Delete delivery person
export const deleteDeliveryPerson = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    await DeliveryDatabaseOperations.deleteDeliveryPerson(id);
    Logger.info(`Delivery person ${id} deleted successfully`);
    return {
      status: true,
      data: {
        message: `Delivery person ${id} deleted successfully`,
      },
    };
  } catch (error) {
    Logger.error(`Error deleting delivery person ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

// Assign delivery person to order
export const assignDeliveryPersonToOrder = async (
  event: IpcMainInvokeEvent,
  token: string,
  orderId: string,
  deliveryPersonId: string
) => {
  try {
    await verifyToken(event, token);
    await DeliveryDatabaseOperations.assignDeliveryPerson(orderId, deliveryPersonId);
    
    // Trigger sync after assignment
    setTimeout(() => syncManager.syncWithRemote(), 100);
    
    Logger.info(`Delivery person ${deliveryPersonId} assigned to order ${orderId}`);
    return {
      status: true,
      data: {
        message: "Delivery person assigned successfully",
      },
    };
  } catch (error) {
    Logger.error("Error assigning delivery person to order:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

// Mark order as picked up
export const markOrderPickedUp = async (
  event: IpcMainInvokeEvent,
  token: string,
  orderId: string
) => {
  try {
    await verifyToken(event, token);
    await DeliveryDatabaseOperations.markOrderPickedUp(orderId);
    
    // Trigger sync after update
    setTimeout(() => syncManager.syncWithRemote(), 100);
    
    Logger.info(`Order ${orderId} marked as picked up`);
    return {
      status: true,
      data: {
        message: "Order marked as picked up",
      },
    };
  } catch (error) {
    Logger.error("Error marking order as picked up:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

// Get orders by delivery person
export const getOrdersByDeliveryPerson = async (
  event: IpcMainInvokeEvent,
  token: string,
  deliveryPersonId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.getOrdersByDeliveryPerson(deliveryPersonId);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting orders by delivery person:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};


// Get available delivery persons
export const getAvailableDeliveryPersons = async (
  event: IpcMainInvokeEvent,
  token: string,
  maxConcurrentDeliveries: number = 3
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryDatabaseOperations.getAvailableDeliveryPersons(maxConcurrentDeliveries);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting available delivery persons:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};