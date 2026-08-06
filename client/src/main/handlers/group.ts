import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import { IpcMainInvokeEvent } from "electron";
import { GroupsDatabaseOperations } from "../database/groupsOperation.js";
import { db } from "../database/index.js";
import {
    syncGroupToVPS,
    deleteGroupFromVPS,
    deleteGroupItemFromVPS,
    syncGroupItemsForGroup,
} from "../utils/sync/index.js";

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
            if (result && result.group) {
                syncGroupToVPS(result.group.id);
                syncGroupItemsForGroup(result.group.id);
            }
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
        deleteGroupFromVPS(groupId);
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

        // Find deleted group items before update commits
        if (groupData && groupData.id) {
            const existingItems = await db("group_items").where({ groupId: groupData.id }).select("id");
            const providedIds = new Set(groupItems.map((item: any) => item.id).filter((id: any) => id));
            const deletedItems = existingItems.filter(item => !providedIds.has(item.id));
            for (const item of deletedItems) {
                deleteGroupItemFromVPS(item.id);
            }
        }

        const result = await GroupsDatabaseOperations.updateGroup(groupData, groupItems);

        if (groupData && groupData.id) {
            syncGroupToVPS(groupData.id);
            syncGroupItemsForGroup(groupData.id);
        }

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