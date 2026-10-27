import { IpcMainInvokeEvent } from "electron";
import {
  GeocodeCacheOperations,
  GeocodeCacheEntry,
} from "../database/geocodeCacheOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

export const getGeocodeCache = async (
  event: IpcMainInvokeEvent,
  token: string,
  addressKeys: string[]
) => {
  try {
    await verifyToken(event, token);
    const result = await GeocodeCacheOperations.getMany(addressKeys || []);
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error reading geocode cache:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const saveGeocodeCache = async (
  event: IpcMainInvokeEvent,
  token: string,
  entries: GeocodeCacheEntry[]
) => {
  try {
    await verifyToken(event, token);
    await GeocodeCacheOperations.saveMany(entries || []);
    return { status: true, data: null };
  } catch (error) {
    Logger.error("Error saving geocode cache:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const setManualGeocode = async (
  event: IpcMainInvokeEvent,
  token: string,
  addressKey: string,
  lat: number,
  lng: number
) => {
  try {
    await verifyToken(event, token);
    await GeocodeCacheOperations.setManual(addressKey, lat, lng);
    return { status: true, data: null };
  } catch (error) {
    Logger.error("Error saving manual geocode:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteGeocodeCacheEntry = async (
  event: IpcMainInvokeEvent,
  token: string,
  addressKey: string
) => {
  try {
    await verifyToken(event, token);
    await GeocodeCacheOperations.deleteKey(addressKey);
    return { status: true, data: null };
  } catch (error) {
    Logger.error("Error deleting geocode cache entry:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const reserveGeocodeSlot = async (
  event: IpcMainInvokeEvent,
  token: string,
  provider: string,
  intervalMs: number
) => {
  try {
    await verifyToken(event, token);
    const waitMs = await GeocodeCacheOperations.reserveRateLimitSlot(
      provider,
      intervalMs
    );
    return { status: true, data: waitMs };
  } catch (error) {
    Logger.error("Error reserving geocode slot:", error);
    return { status: false, error: (error as Error).message };
  }
};
