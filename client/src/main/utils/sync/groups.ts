import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue a complement group upsert to the VPS.
 */
export async function syncGroupToVPS(groupId: string): Promise<void> {
    try {
        const group = await db("groups").where({ id: groupId }).first();
        if (!group) return;

        enqueue("group", "upsert", {
            id: group.id,
            name: group.name,
            color: group.color || "green",
            forProduct: !!group.forProduct,
        });
    } catch (err) {
        Logger.error(`SyncManager [groups]: error queuing upsert for group ${groupId}:`, err);
    }
}

/**
 * Enqueue a complement group delete to the VPS.
 */
export function deleteGroupFromVPS(groupId: string): void {
    try {
        enqueue("group", "delete", { id: groupId });
    } catch (err) {
        Logger.error(`SyncManager [groups]: error queuing delete for group ${groupId}:`, err);
    }
}

/**
 * Enqueue a group item upsert to the VPS.
 */
export async function syncGroupItemToVPS(itemId: string): Promise<void> {
    try {
        const item = await db("group_items").where({ id: itemId }).first();
        if (!item) return;

        enqueue("groupitem", "upsert", {
            id: item.id,
            name: item.name,
            price: item.price,
            priority: item.priority || 0,
            imgUrl: item.imgUrl || "",
            groupId: item.groupId,
        });
    } catch (err) {
        Logger.error(`SyncManager [groups]: error queuing upsert for group item ${itemId}:`, err);
    }
}

/**
 * Enqueue a group item delete to the VPS.
 */
export function deleteGroupItemFromVPS(itemId: string): void {
    try {
        enqueue("groupitem", "delete", { id: itemId });
    } catch (err) {
        Logger.error(`SyncManager [groups]: error queuing delete for group item ${itemId}:`, err);
    }
}

/**
 * Enqueue all current group items for a group to the VPS.
 */
export async function syncGroupItemsForGroup(groupId: string): Promise<void> {
    try {
        const items = await db("group_items").where({ groupId });
        for (const item of items) {
            enqueue("groupitem", "upsert", {
                id: item.id,
                name: item.name,
                price: item.price,
                priority: item.priority || 0,
                imgUrl: item.imgUrl || "",
                groupId: item.groupId,
            });
        }
    } catch (err) {
        Logger.error(`SyncManager [groups]: error queuing items upsert for group ${groupId}:`, err);
    }
}
