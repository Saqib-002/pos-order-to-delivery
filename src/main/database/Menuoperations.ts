import { localDb } from "./index.js";
import { MenuItem, OrderItem } from "@/types/Menu.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class MenuDatabaseOperations {
  // Menu Items CRUD Operations
  static async createMenuItem(
    menuItem: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
  ): Promise<MenuItem> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newMenuItem = {
        id,
        ...menuItem,
        ingredients: menuItem.ingredients
          ?.map((ingredient) => ingredient.trim())
          .join(","),
        createdAt: now,
        updatedAt: now,
      };
      await localDb("menu_items").insert(newMenuItem);
      Logger.info(`Menu item created: ${newMenuItem.name}`);
      return {
        ...newMenuItem,
        ingredients: newMenuItem.ingredients?.split(","),
      };
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItems(): Promise<MenuItem[]> {
    try {
      const rows = await localDb("menu_items")
        .where("isDeleted", false)
        .orderBy("category", "asc")
        .orderBy("name", "asc");
      return rows.map((row) => ({
        ...row,
        ingredients: row.ingredients?.split(","),
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    try {
      const rows = await localDb("menu_items")
        .where("category", category)
        .andWhere("isDeleted", false)
        .andWhere("isAvailable", true)
        .orderBy("name", "asc");
      return rows.map((row) => ({
        ...row,
        ingredients: row.ingredients?.split(","),
      }));
    } catch (error) {
      throw error;
    }
  }

  static async updateMenuItem(
    id: string,
    updates: Partial<MenuItem>
  ): Promise<MenuItem> {
    try {
      const now = new Date().toISOString();

      await localDb("menu_items")
        .where("id", id)
        .update({
          ...updates,
          ingredients: updates.ingredients
            ?.map((ingredient) => ingredient.trim())
            .join(","),
          updatedAt: now,
          
        });

      const updatedItem = await localDb("menu_items").where("id", id).first();

      if (!updatedItem) {
        throw new Error("Menu item not found after update");
      }

      Logger.info(`Menu item updated: ${id}`);
      return {
        ...updatedItem,
        ingredients: updatedItem.ingredients?.split(","),
      };
    } catch (error) {
      throw error;
    }
  }

  static async deleteMenuItem(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await localDb("menu_items").where("id", id).update({
        isDeleted: true,
        updatedAt: now,
        
      });

      Logger.info(`Menu item deleted: ${id}`);
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItemById(id: string): Promise<MenuItem | null> {
    try {
      const row = await localDb("menu_items")
        .where("id", id)
        .andWhere("isDeleted", false)
        .first();
      return row || null;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItemsByName(name: string): Promise<MenuItem[]> {
    try {
      const rows = await localDb("menu_items")
        .where("isDeleted", false)
        .andWhere("isAvailable", true)
        .where(function () {
          this.where("name", "like", `%${name}%`).orWhere(
            "description",
            "like",
            `%${name}%`
          );
        })
        .orderBy("name", "asc");

      Logger.info(
        `Searching for menu items with term: "${name}", found ${rows.length} results`
      );

      return rows.map((row) => ({
        ...row,
        ingredients: row.ingredients?.split(","),
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const rows = await localDb("menu_items")
        .distinct("category")
        .where("isDeleted", false)
        .orderBy("category", "asc");

      return rows.map((row) => row.category);
    } catch (error) {
      throw error;
    }
  }
}
