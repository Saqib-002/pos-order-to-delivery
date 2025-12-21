import { IpcMainInvokeEvent } from "electron";
import { WorkerDatabaseOperations } from "../database/workersOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

// Worker Handlers
export const createWorker = async (event: IpcMainInvokeEvent, token: string, data: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.createWorker(data);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error creating worker:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const getWorkers = async (event: IpcMainInvokeEvent, token: string, filters: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.getWorkers(filters || {});
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting workers:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const updateWorker = async (event: IpcMainInvokeEvent, token: string, id: string, updates: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.updateWorker(id, updates);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error updating worker:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteWorker = async (event: IpcMainInvokeEvent, token: string, id: string) => {
  try {
    await verifyToken(event, token);
    await WorkerDatabaseOperations.deleteWorker(id);
    return { status: true, data: { message: "Worker deleted" } };
  } catch (error) {
    Logger.error("Error deleting worker:", error);
    return { status: false, error: (error as Error).message };
  }
};

// Salary Handlers
export const addSalaryRecord = async (event: IpcMainInvokeEvent, token: string, data: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.addSalaryRecord(data);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error adding salary:", error);
    return { status: false, error: (error as Error).message };
  }
};
export const updateSalaryRecord = async (event: IpcMainInvokeEvent, token: string, id: string, updates: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.updateSalaryRecord(id, updates);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error updating salary record:", error);
    return { status: false, error: (error as Error).message };
  }
};
export const getSalaryRecords = async (event: IpcMainInvokeEvent, token: string, workerId: string, filters: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.getSalaryRecords(workerId, filters || {});
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting salary records:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteSalaryRecord = async (event: IpcMainInvokeEvent, token: string, id: string) => {
  try {
    await verifyToken(event, token);
    await WorkerDatabaseOperations.deleteSalaryRecord(id);
    return { status: true, data: { message: "Salary record deleted" } };
  } catch (error) {
    Logger.error("Error deleting salary record:", error);
    return { status: false, error: (error as Error).message };
  }
};