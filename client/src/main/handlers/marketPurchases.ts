import { IpcMainInvokeEvent } from "electron";
import { MarketPurchaseDatabaseOperations } from "../database/marketPurchaseOperations.js";
import { verifyToken } from "./auth.js";

export const createMarketPurchase = async (
  event: IpcMainInvokeEvent,
  token: string,
  purchaseData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await MarketPurchaseDatabaseOperations.createMarketPurchase(purchaseData);
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

export const updateMarketPurchase = async (
  event: IpcMainInvokeEvent,
  token: string,
  purchaseId: string,
  purchaseData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await MarketPurchaseDatabaseOperations.updateMarketPurchase(
      purchaseId,
      purchaseData
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

export const deleteMarketPurchase = async (
  event: IpcMainInvokeEvent,
  token: string,
  purchaseId: string
) => {
  try {
    await verifyToken(event, token);
    await MarketPurchaseDatabaseOperations.deleteMarketPurchase(purchaseId);
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

export const getAllMarketPurchases = async (
  event: IpcMainInvokeEvent,
  token: string,
  filters?: {
    supplierId?: string;
    expenseTypeId?: string;
    startDate?: string;
    endDate?: string;
    ticketNumber?: string;
  }
) => {
  try {
    await verifyToken(event, token);
    const result =
      await MarketPurchaseDatabaseOperations.getAllMarketPurchases(filters);
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

export const getMarketPurchaseById = async (
  event: IpcMainInvokeEvent,
  token: string,
  purchaseId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await MarketPurchaseDatabaseOperations.getMarketPurchaseById(purchaseId);
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
