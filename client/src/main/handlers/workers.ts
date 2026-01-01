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

// Payment Transaction Handlers
export const addPaymentTransaction = async (event: IpcMainInvokeEvent, token: string, data: any) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.addPaymentTransaction(data);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error adding payment transaction:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const addMultiplePaymentTransactions = async (
  event: IpcMainInvokeEvent,
  token: string,
  salaryId: string,
  payments: any[]
) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.addMultiplePaymentTransactions(salaryId, payments);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error adding multiple payment transactions:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const updatePaymentTransaction = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  updates: any
) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.updatePaymentTransaction(id, updates);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error updating payment transaction:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const getPaymentTransactions = async (
  event: IpcMainInvokeEvent,
  token: string,
  salaryId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.getPaymentTransactions(salaryId);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting payment transactions:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deletePaymentTransaction = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    await WorkerDatabaseOperations.deletePaymentTransaction(id);
    return { status: true, data: { message: "Payment transaction deleted" } };
  } catch (error) {
    Logger.error("Error deleting payment transaction:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const getTotalPaidForSalary = async (
  event: IpcMainInvokeEvent,
  token: string,
  salaryId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await WorkerDatabaseOperations.getTotalPaidForSalary(salaryId);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting total paid for salary:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteAllPaymentTransactions = async (
  event: IpcMainInvokeEvent,
  token: string,
  salaryId: string
) => {
  try {
    await verifyToken(event, token);
    await WorkerDatabaseOperations.deleteAllPaymentTransactions(salaryId);
    return { status: true, data: { message: "All payment transactions deleted" } };
  } catch (error) {
    Logger.error("Error deleting all payment transactions:", error);
    return { status: false, error: (error as Error).message };
  }
};