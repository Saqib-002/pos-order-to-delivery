import { IpcMainInvokeEvent } from "electron";
import { VehicleDatabaseOperations } from "../database/vehiclesOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

export const createVehicle = async (event: IpcMainInvokeEvent, token: string, vehicleData: any) => {
  try {
    await verifyToken(event, token);
    const result = await VehicleDatabaseOperations.createVehicle(vehicleData);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error creating vehicle:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const getVehicles = async (event: IpcMainInvokeEvent, token: string, filters: any) => {
  try {
    await verifyToken(event, token);
    // filters object passed directly to DB operations
    const result = await VehicleDatabaseOperations.getVehicles(filters || {});
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting vehicles:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const updateVehicle = async (event: IpcMainInvokeEvent, token: string, id: string, updates: any) => {
  try {
    await verifyToken(event, token);
    const result = await VehicleDatabaseOperations.updateVehicle(id, updates);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error updating vehicle:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteVehicle = async (event: IpcMainInvokeEvent, token: string, id: string) => {
  try {
    await verifyToken(event, token);
    await VehicleDatabaseOperations.deleteVehicle(id);
    return { status: true, data: { message: "Vehicle deleted" } };
  } catch (error) {
    Logger.error("Error deleting vehicle:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const addVehicleMaintenance = async (event: IpcMainInvokeEvent, token: string, data: any) => {
  try {
    await verifyToken(event, token);
    const result = await VehicleDatabaseOperations.addMaintenanceRecord(data);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error adding maintenance:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const updateVehicleMaintenance = async (event: IpcMainInvokeEvent, token: string, id: string, updates: any) => {
  try {
    await verifyToken(event, token);
    const result = await VehicleDatabaseOperations.updateMaintenanceRecord(id, updates);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error updating maintenance:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteVehicleMaintenance = async (event: IpcMainInvokeEvent, token: string, id: string) => {
  try {
    await verifyToken(event, token);
    await VehicleDatabaseOperations.deleteMaintenanceRecord(id);
    return { status: true, data: { message: "Maintenance record deleted" } };
  } catch (error) {
    Logger.error("Error deleting maintenance:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const getVehicleMaintenance = async (event: IpcMainInvokeEvent, token: string, vehicleId: string, filters: any) => {
  try {
    await verifyToken(event, token);
    const result = await VehicleDatabaseOperations.getMaintenanceRecords(vehicleId, filters || {});
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting maintenance:", error);
    return { status: false, error: (error as Error).message };
  }
};