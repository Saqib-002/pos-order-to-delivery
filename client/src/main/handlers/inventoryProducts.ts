import { IpcMainInvokeEvent } from "electron";
import { InventoryProductDatabaseOperations } from "../database/inventoryProductOperations.js";
import { verifyToken } from "./auth.js";

export const createInventoryProduct = async (
  event: IpcMainInvokeEvent,
  token: string,
  productData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await InventoryProductDatabaseOperations.createInventoryProduct(
        productData
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

export const updateInventoryProduct = async (
  event: IpcMainInvokeEvent,
  token: string,
  productId: string,
  productData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await InventoryProductDatabaseOperations.updateInventoryProduct(
        productId,
        productData
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

export const deleteInventoryProduct = async (
  event: IpcMainInvokeEvent,
  token: string,
  productId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await InventoryProductDatabaseOperations.deleteInventoryProduct(
        productId
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

export const getAllInventoryProducts = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await InventoryProductDatabaseOperations.getAllInventoryProducts();
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

export const getInventoryProductById = async (
  event: IpcMainInvokeEvent,
  token: string,
  productId: string
) => {
  try {
    await verifyToken(event, token);
    const result =
      await InventoryProductDatabaseOperations.getInventoryProductById(
        productId
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
