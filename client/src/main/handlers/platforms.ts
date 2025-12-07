import { IpcMainInvokeEvent } from "electron";
import { PlatformDatabaseOperations } from "../database/platformOperations.js";
import { verifyToken } from "./auth.js";

export const createPlatform = async (
  event: IpcMainInvokeEvent,
  token: string,
  platformData: any
) => {
  try {
    await verifyToken(event, token);
    const result =
      await PlatformDatabaseOperations.createPlatform(platformData);
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

export const updatePlatform = async (
  event: IpcMainInvokeEvent,
  token: string,
  platformId: string,
  platformData: any
) => {
  try {
    await verifyToken(event, token);
    const result = await PlatformDatabaseOperations.updatePlatform(
      platformId,
      platformData
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

export const deletePlatform = async (
  event: IpcMainInvokeEvent,
  token: string,
  platformId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await PlatformDatabaseOperations.deletePlatform(platformId);
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

export const getAllPlatforms = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await PlatformDatabaseOperations.getAllPlatforms();
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

export const getPlatformById = async (
  event: IpcMainInvokeEvent,
  token: string,
  platformId: string
) => {
  try {
    await verifyToken(event, token);
    const result = await PlatformDatabaseOperations.getPlatformById(platformId);
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
