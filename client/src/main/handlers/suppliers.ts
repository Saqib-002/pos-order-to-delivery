import { IpcMainInvokeEvent } from "electron";
import { SupplierDatabaseOperations } from "../database/supplierOperations.js";
import { verifyToken } from "./auth.js";

export const createSupplier = async (
  event: IpcMainInvokeEvent,
  token: string,
  supplierData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await SupplierDatabaseOperations.createSupplier(supplierData);
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

export const updateSupplier = async (
  event: IpcMainInvokeEvent,
  token: string,
  supplierId: string,
  supplierData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await SupplierDatabaseOperations.updateSupplier(
      supplierId,
      supplierData
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

export const deleteSupplier = async (
  event: IpcMainInvokeEvent,
  token: string,
  supplierId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await SupplierDatabaseOperations.deleteSupplier(supplierId);
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

export const getAllSuppliers = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await SupplierDatabaseOperations.getAllSuppliers();
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

export const getSupplierById = async (
  event: IpcMainInvokeEvent,
  token: string,
  supplierId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await SupplierDatabaseOperations.getSupplierById(supplierId);
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
