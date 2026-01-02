import { IpcMainInvokeEvent } from "electron";
import { IncomeSourceDatabaseOperations } from "../database/incomeSourceOperations.js";
import { verifyToken } from "./auth.js";

export const createIncomeSource = async (
  event: IpcMainInvokeEvent,
  token: string,
  incomeSourceData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await IncomeSourceDatabaseOperations.createIncomeSource(incomeSourceData);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const updateIncomeSource = async (
  event: IpcMainInvokeEvent,
  token: string,
  incomeSourceId: string,
  incomeSourceData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await IncomeSourceDatabaseOperations.updateIncomeSource(
      incomeSourceId,
      incomeSourceData
    );
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const deleteIncomeSource = async (
  event: IpcMainInvokeEvent,
  token: string,
  incomeSourceId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await IncomeSourceDatabaseOperations.deleteIncomeSource(incomeSourceId);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getAllIncomeSources = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await IncomeSourceDatabaseOperations.getAllIncomeSources();
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getIncomeSourceById = async (
  event: IpcMainInvokeEvent,
  token: string,
  incomeSourceId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await IncomeSourceDatabaseOperations.getIncomeSourceById(incomeSourceId);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
