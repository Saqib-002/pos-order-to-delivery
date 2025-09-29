import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { IpcMainInvokeEvent } from "electron";
import { GroupsDatabaseOperations } from "../database/groupsOperation.js";

export const createGroup = async (
    event: IpcMainInvokeEvent,
    token: string,
    groupData: any,
    groupItems: any
) => {
    try {
            await verifyToken(event, token);
            const result = await GroupsDatabaseOperations.createGroup(
                groupData,
                groupItems
            );
            return {
                status: true,
                data: result,
            };
        } catch (error) {
            Logger.error("Error creating group:", error);
            return {
                status: false,
                error: (error as Error).message,
            };
        }
};
export const getGroups = async (event: IpcMainInvokeEvent, token: string) => {
    try {
        await verifyToken(event, token);
        const result = await GroupsDatabaseOperations.getGroups();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error getting groups:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const deleteGroup = async (event: IpcMainInvokeEvent, token: string, groupId: string) => {
    try {
        await verifyToken(event, token);
        const result = await GroupsDatabaseOperations.deleteGroup(groupId);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error deleting group:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const updateGroup = async (event: IpcMainInvokeEvent, token: string, groupData: any, groupItems: any) => {
    try {
        await verifyToken(event, token);
        const result = await GroupsDatabaseOperations.updateGroup(groupData, groupItems);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error updating group:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}
export const getAttachProductsByGroupId= async (event: IpcMainInvokeEvent, token: string, groupId: string) => {
    try {
        await verifyToken(event, token);
        const result = await GroupsDatabaseOperations.getAttachProductsByGroupId(groupId);
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        Logger.error("Error updating group:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
}