import { IpcMainInvokeEvent } from "electron";
import { verifyToken } from "./auth.js";
import { FinancialDatabaseOperations } from "../database/financialOperations.js";

export const getFinancialAnalytics = async (
  event: IpcMainInvokeEvent,
  token: string,
  filter: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await FinancialDatabaseOperations.getFinancialAnalytics(filter);
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
