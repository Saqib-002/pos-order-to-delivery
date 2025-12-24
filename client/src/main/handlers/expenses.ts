import { IpcMainInvokeEvent } from "electron";
import { ExpenseDatabaseOperations } from "../database/expenseOperations.js";
import { verifyToken } from "./auth.js";

export const createExpense = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await ExpenseDatabaseOperations.createExpense(expenseData);
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

export const updateExpense = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseId: string,
  expenseData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await ExpenseDatabaseOperations.updateExpense(
      expenseId,
      expenseData
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

export const deleteExpense = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseId: string
) => {
  try {
    await verifyToken(event, token);
    await ExpenseDatabaseOperations.deleteExpense(expenseId);
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

export const getAllExpenses = async (
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
    const result = await ExpenseDatabaseOperations.getExpenses(filters || {});
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

export const getExpenseById = async (
  event: IpcMainInvokeEvent,
  token: string,
  expenseId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await ExpenseDatabaseOperations.getExpenseById(expenseId);
    if (!result) {
      return {
        status: false,
        error: "Expense not found",
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
