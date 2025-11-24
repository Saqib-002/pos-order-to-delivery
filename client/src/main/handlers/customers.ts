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
export const getCustomerById = async (
  event: IpcMainInvokeEvent,
  token: string,
  customerId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.getCustomerById(customerId);
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
export const getCustomerByPhone = async (
  event: IpcMainInvokeEvent,
  token: string,
  phone: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.getCustomerByPhone(phone);
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
export const updateCustomerById = async (
  event: IpcMainInvokeEvent,
  token: string,
  customerId: string,
  customer: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CustomerDatabaseOperations.updateCustomer(
      customerId,
      customer
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
export const deleteCustomer = async (
  event: IpcMainInvokeEvent,
  token: string,
  customerId: string
) => {
  try {
    await verifyToken(event, token);
    await CustomerDatabaseOperations.deleteCustomer(customerId);
    return {
      status: true,
    };
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
