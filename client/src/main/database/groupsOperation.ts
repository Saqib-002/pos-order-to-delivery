import { Group, GroupItem } from "@/types/groups";
import { randomUUID } from "crypto";
import { db } from "./index.js";

export class GroupsDatabaseOperations {
  static async createGroup(
    GroupData: Omit<Group, "id" | "createdAt" | "updatedAt">,
    GroupItems: GroupItem[]
  ) {
    {
      const trx = await db.transaction();
      try {
        const now = new Date().toISOString();
        const newGroup = {
          id: randomUUID(),
          ...GroupData,
          createdAt: now,
          updatedAt: now,
        };
        await trx("groups").insert(newGroup);
        const newGroupItems = [];
        for (const item of GroupItems) {
          const newItem = {
            ...item,
            id: randomUUID(),
            groupId: newGroup.id,
            createdAt: now,
            updatedAt: now,
          };
          await trx("group_items").insert(newItem);
          newGroupItems.push(newItem);
        }
        await trx.commit();
        return {
          group: newGroup,
          GroupItems: newGroupItems,
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    }
  }
  static async getGroups() {
    try {
      let query = db("groups")
        .select(
          "groups.id as groupId",
          "groups.name",
          "groups.color",
          "groups.createdAt as groupCreatedAt",
          "groups.updatedAt as groupUpdatedAt",
          "group_items.id as itemId",
          "group_items.name as itemName",
          "group_items.priority",
          "group_items.price",
          "group_items.createdAt as itemCreatedAt",
          "group_items.updatedAt as itemUpdatedAt"
        )
        .leftJoin("group_items", "groups.id", "group_items.groupId")
        .orderBy("groups.createdAt", "asc")
        .orderBy("group_items.priority", "dsc");
      const groupsMap = new Map();
      const rows = await query;

      rows.forEach((row) => {
        const group = {
          id: row.groupId,
          name: row.name,
          color: row.color,
          createdAt: row.groupCreatedAt,
          updatedAt: row.groupUpdatedAt,
          items: [],
        };
        if (!groupsMap.has(row.groupId)) {
          groupsMap.set(row.groupId, group);
        }
        if (row.itemId) {
          groupsMap.get(row.groupId).items.push({
            id: row.itemId,
            name: row.itemName,
            priority: row.priority,
            price: row.price,
            createdAt: row.itemCreatedAt,
            updatedAt: row.itemUpdatedAt,
          });
        }
      });
      return Array.from(groupsMap.values());
    } catch (error) {
      throw error;
    }
  }
  static async deleteGroup(groupId: string) {
    try {
      await db("groups").where("id", groupId).delete();
    } catch (error) {
      throw error;
    }
  }
  static async updateGroup(
    groupData: Omit<Group, "createdAt" | "updatedAt">,
    groupItems: GroupItem[]
  ) {
    const trx = await db.transaction();
    try {
      const now = new Date().toISOString();
      await trx("groups").where("id", groupData.id).update(groupData);
      const existingItems = await trx("group_items")
        .where("groupId", groupData.id)
        .select("id");
      const providedItemIds = new Set(
        groupItems.map((item) => item.id).filter((id) => id)
      );
      const itemsToDelete = existingItems.filter(
        (item) => !providedItemIds.has(item.id)
      );
      if (itemsToDelete.length > 0) {
        const itemIdsToDelete = itemsToDelete.map((item) => item.id);
        await trx("group_items")
          .where("groupId", groupData.id)
          .whereIn("id", itemIdsToDelete)
          .delete();
      }
      for (const item of groupItems) {
        const existingItem = await trx("group_items")
          .where("groupId", groupData.id)
          .andWhere("id", item.id)
          .first();
        if (existingItem) {
          await trx("group_items")
            .where("groupId", groupData.id)
            .andWhere("id", item.id)
            .update(item);
        } else {
          await trx("group_items").insert({
            ...item,
            id: randomUUID(),
            groupId: groupData.id,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  static async getAttachProductsByGroupId(groupId: string) {
    try {
      const products = await db("products_groups")
        .join(
          "products",
          "products_groups.productId",
          "=",
          "products.id"
        ).join("sub_categories", "products.subcategoryId", "=", "sub_categories.id")
        .where("products_groups.groupId", groupId)
        .select(
          "products.id as productId",
          "products.name as productName",
          "products.price as productPrice",
          "sub_categories.name as subcategoryName"
        );
      return products;
    } catch (error) {
      throw error;
    }
  }
}
