import { IpcMainInvokeEvent } from "electron";
import { ExpenseTypeDatabaseOperations } from "../database/expenseTypeOperations.js";
import { verifyToken } from "./auth.js";

export const createExpenseType = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseTypeData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await ExpenseTypeDatabaseOperations.createExpenseType(expenseTypeData);
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

export const updateExpenseType = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseTypeId: string,
  expenseTypeData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await ExpenseTypeDatabaseOperations.updateExpenseType(
      expenseTypeId,
      expenseTypeData
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

export const deleteExpenseType = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseTypeId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await ExpenseTypeDatabaseOperations.deleteExpenseType(expenseTypeId);
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

export const getAllExpenseTypes = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await ExpenseTypeDatabaseOperations.getAllExpenseTypes();
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

export const getExpenseTypeById = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseTypeId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await ExpenseTypeDatabaseOperations.getExpenseTypeById(expenseTypeId);
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
