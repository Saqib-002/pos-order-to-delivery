import { IpcMainInvokeEvent } from "electron";
import { DeliveryRadarGroupsOperations } from "../database/deliveryRadarGroupsOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

// Every mutation responds with the fresh group list so the radar can render it
// directly without a second round trip.

export const getDeliveryRadarGroups = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: result };
  } catch (error) {
    Logger.error("Error getting delivery radar groups:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const createDeliveryRadarGroup = async (
  event: IpcMainInvokeEvent,
  token: string,
  data: { name?: string; nameTemplate?: string; color: string }
) => {
  try {
    await verifyToken(event, token);
    const group = await DeliveryRadarGroupsOperations.createGroup(data);
    const groups = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: { group, groups } };
  } catch (error) {
    Logger.error("Error creating delivery radar group:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const updateDeliveryRadarGroup = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  updates: { name?: string; color?: string }
) => {
  try {
    await verifyToken(event, token);
    await DeliveryRadarGroupsOperations.updateGroup(id, updates);
    const groups = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: groups };
  } catch (error) {
    Logger.error("Error updating delivery radar group:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const deleteDeliveryRadarGroup = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    await DeliveryRadarGroupsOperations.deleteGroup(id);
    const groups = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: groups };
  } catch (error) {
    Logger.error("Error deleting delivery radar group:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const addOrdersToDeliveryRadarGroup = async (
  event: IpcMainInvokeEvent,
  token: string,
  groupId: string,
  orderIds: string[]
) => {
  try {
    await verifyToken(event, token);
    await DeliveryRadarGroupsOperations.addOrdersToGroup(groupId, orderIds);
    const groups = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: groups };
  } catch (error) {
    Logger.error("Error adding orders to delivery radar group:", error);
    return { status: false, error: (error as Error).message };
  }
};

export const removeOrdersFromDeliveryRadarGroups = async (
  event: IpcMainInvokeEvent,
  token: string,
  orderIds: string[]
) => {
  try {
    await verifyToken(event, token);
    await DeliveryRadarGroupsOperations.removeOrdersFromGroups(orderIds);
    const groups = await DeliveryRadarGroupsOperations.getGroups();
    return { status: true, data: groups };
  } catch (error) {
    Logger.error("Error removing orders from delivery radar groups:", error);
    return { status: false, error: (error as Error).message };
  }
};
