import { db } from "./index.js";
import { Menu, MenuPageAssociation } from "@/types/menuPages.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class MenusOperations {
  // Menus CRUD Operations
  static async createMenu(
    menu: Omit<Menu, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<Menu> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newMenu = {
        id,
        ...menu,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      await db("menus").insert(newMenu);
      Logger.info(`Menu created: ${newMenu.name}`);
      return newMenu;
    } catch (error) {
      throw error;
    }
  }

  static async getMenus(): Promise<Menu[]> {
    try {
      const menus = await db("menus")
        .where("isDeleted", false)
        .orderBy("name", "asc");
      return menus;
    } catch (error) {
      throw error;
    }
  }

  static async getMenusBySubcategory(subcategoryId: string): Promise<Menu[]> {
    try {
      const menus = await db("menus")
        .where("subcategoryId", subcategoryId)
        .andWhere("isDeleted", false)
        .orderBy("priority", "asc");
      return menus;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuById(id: string): Promise<Menu | null> {
    try {
      const menu = await db("menus")
        .where("id", id)
        .andWhere("isDeleted", false)
        .first();
      return menu || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateMenu(
    id: string,
    updates: Partial<Menu>
  ): Promise<Menu> {
    try {
      const now = new Date().toISOString();
      await db("menus")
        .where("id", id)
        .update({
          ...updates,
          updatedAt: now,
        });

      const updatedMenu = await db("menus").where("id", id).first();
      if (!updatedMenu) {
        throw new Error("Menu not found after update");
      }

      Logger.info(`Menu updated: ${id}`);
      return updatedMenu;
    } catch (error) {
      throw error;
    }
  }

  static async deleteMenu(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db("menus").where("id", id).update({
        isDeleted: true,
        updatedAt: now,
      });
      Logger.info(`Menu deleted: ${id}`);
    } catch (error) {
      throw error;
    }
  }

  // Menu Page Associations Operations
  static async addMenuPageAssociation(
    menuId: string,
    menuPageId: string,
    pageName: string,
    minimum: number = 1,
    maximum: number = 1,
    priority: number = 0,
    kitchenPriority: string = "Priority 1",
    multiple: string = "No"
  ): Promise<MenuPageAssociation> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const association = {
        id,
        menuId,
        menuPageId,
        pageName,
        minimum,
        maximum,
        priority,
        kitchenPriority,
        multiple,
        createdAt: now,
        updatedAt: now,
      };
      await db("menu_page_associations").insert(association);
      Logger.info(`Menu page association created: ${pageName}`);
      return association;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuPageAssociations(menuId: string): Promise<MenuPageAssociation[]> {
    try {
      const associations = await db("menu_page_associations")
        .where("menuId", menuId)
        .orderBy("priority", "asc");
      return associations;
    } catch (error) {
      throw error;
    }
  }

  static async updateMenuPageAssociation(
    id: string,
    updates: Partial<MenuPageAssociation>
  ): Promise<MenuPageAssociation> {
    try {
      const now = new Date().toISOString();
      await db("menu_page_associations")
        .where("id", id)
        .update({
          ...updates,
          updatedAt: now,
        });

      const updatedAssociation = await db("menu_page_associations").where("id", id).first();
      if (!updatedAssociation) {
        throw new Error("Menu page association not found after update");
      }

      Logger.info(`Menu page association updated: ${id}`);
      return updatedAssociation;
    } catch (error) {
      throw error;
    }
  }

  static async removeMenuPageAssociation(id: string): Promise<void> {
    try {
      await db("menu_page_associations").where("id", id).delete();
      Logger.info(`Menu page association removed: ${id}`);
    } catch (error) {
      throw error;
    }
  }

  static async removeAllMenuPageAssociations(menuId: string): Promise<void> {
    try {
      await db("menu_page_associations").where("menuId", menuId).delete();
      Logger.info(`All menu page associations removed for menu: ${menuId}`);
    } catch (error) {
      throw error;
    }
  }
}
