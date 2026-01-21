import { IpcMainInvokeEvent } from "electron";
import { verifyToken } from "./auth.js";
import { CashOutDatabaseOperations } from "../database/CashOutOperations.js";

export const createCashOut = async (
  event: IpcMainInvokeEvent,
  token: string,
  data: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CashOutDatabaseOperations.createCashOut(data);
    return { status: true, data: result };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};

export const getCashOuts = async (
  event: IpcMainInvokeEvent,
  token: string,
  filters: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CashOutDatabaseOperations.getCashOuts(filters);
    return { status: true, data: result };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};

export const updateCashOut = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  data: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CashOutDatabaseOperations.updateCashOut(id, data);
    return { status: true, data: result };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};

export const deleteCashOut = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    await CashOutDatabaseOperations.deleteCashOut(id);
    return { status: true };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};

export const getCashBalance = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CashOutDatabaseOperations.getCashBalance();
    return { status: true, data: result };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};
