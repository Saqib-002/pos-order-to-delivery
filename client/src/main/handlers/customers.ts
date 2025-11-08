import { IpcMainInvokeEvent } from "electron";
import { CustomerDatabaseOperations } from "../database/customerOperations.js";
import { verifyToken } from "./auth.js";

export const createCustomer = async (
  event: IpcMainInvokeEvent,
  token: string,
  customer: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.createCustomer(customer);
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
export const getCustomersByPhone = async (
  event: IpcMainInvokeEvent,
  token: string,
  phone: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.getCustomersByPhone(phone);
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
export const updateCustomer = async (
  event: IpcMainInvokeEvent,
  token: string,
  customer: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.upsertCustomer(customer);
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
export const getAllCustomers = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.getAllCustomers();
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
