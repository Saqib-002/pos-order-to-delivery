import { IpcMainInvokeEvent } from "electron";
import { OtherIncomeDatabaseOperations } from "../database/OtherIncomeOperations.js";
import { verifyToken } from "./auth.js";

export const createOtherIncome = async (
  event: IpcMainInvokeEvent,
  token: string,
  otherIncomeData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await OtherIncomeDatabaseOperations.createOtherIncome(otherIncomeData);
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

export const updateOtherIncome = async (
  event: IpcMainInvokeEvent,
  token: string,
  otherIncomeId: string,
  otherIncomeData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await OtherIncomeDatabaseOperations.updateOtherIncome(
      otherIncomeId,
      otherIncomeData
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

export const deleteOtherIncome = async (
  event: IpcMainInvokeEvent,
  token: string,
  otherIncomeId: string
) => {
  try {
    await verifyToken(event, token);
    await OtherIncomeDatabaseOperations.deleteOtherIncome(otherIncomeId);
    return {
      status: true,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};

export const getAllOtherIncomes = async (
  event: IpcMainInvokeEvent,
  token: string,
  filters?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }
) => {
  try {
    await verifyToken(event, token);
    const result = await OtherIncomeDatabaseOperations.getOtherIncomes(filters || {});
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

export const getOtherIncomeById = async (
  event: IpcMainInvokeEvent,
  token: string,
  otherIncomeId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await OtherIncomeDatabaseOperations.getOtherIncomeById(otherIncomeId);
    if (!result) {
      return {
        status: false,
        error: "Other income not found",
      };
    }
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
