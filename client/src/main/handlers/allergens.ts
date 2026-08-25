import { IpcMainInvokeEvent } from "electron";
import { AllergenDatabaseOperations } from "../database/allergenOperations.js";
import { verifyToken } from "./auth.js";

export const createAllergen = async (
  event: IpcMainInvokeEvent,
  token: string,
  allergenData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.createAllergen(allergenData);
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

export const updateAllergen = async (
  event: IpcMainInvokeEvent,
  token: string,
  allergenId: string,
  allergenData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.updateAllergen(
      allergenId,
      allergenData
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

export const deleteAllergen = async (
  event: IpcMainInvokeEvent,
  token: string,
  allergenId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.deleteAllergen(allergenId);
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

export const getAllAllergens = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.getAllAllergens();
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

export const getAllergenById = async (
  event: IpcMainInvokeEvent,
  token: string,
  allergenId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.getAllergenById(allergenId);
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

export const getProductAllergensByProductId = async (
  event: IpcMainInvokeEvent,
  token: string,
  productId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.getProductAllergensByProductId(productId);
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

export const updateProductAllergens = async (
  event: IpcMainInvokeEvent,
  token: string,
  productId: string,
  allergens: any[]
) => {
  try {
    await verifyToken(event, token);
    const result = await AllergenDatabaseOperations.updateProductAllergens(
      productId,
      allergens
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

