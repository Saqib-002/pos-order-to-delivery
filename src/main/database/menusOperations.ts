import { db } from "./index.js";
import { Menu, MenuPageAssociation } from "@/types/menuPages.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class MenusOperations {
  static async createMenu(
    menu: Omit<Menu, "id" | "createdAt" | "updatedAt">,
    MenuPageAssociations: Omit<MenuPageAssociation, "id" | "createdAt" | "updatedAt">[]
  ): Promise<Menu> {
    const trx=await db.transaction();
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newMenu = {
        id,
        ...menu,
        createdAt: now,
        updatedAt: now,
      };
      await trx("menus").insert(newMenu);
      const newMenuPageAssociations = [];
      for (const association of MenuPageAssociations) {
        const newAssociation = {
          ...association,
          id: randomUUID(),
          menuId: id,
          createdAt: now,
          updatedAt: now,
        };
        newMenuPageAssociations.push(newAssociation);
      }
      await trx("menu_page_associations").insert(newMenuPageAssociations);
      await trx.commit();
      return newMenu;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getMenus(): Promise<Menu[]> {
    try {
      const menus = await db("menus")
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
        .orderBy("priority", "asc");
      return menus;
    } catch (error) {
      throw error;
    }
  }
  static async getMenuById(id: string): Promise<Menu> {
    try {
      const menu = await db("menus")
        .where("id", id)
        .first();
      return menu;
    } catch (error) {
      throw error;
    }
  }

  static async updateMenu(
    id: string,
    updates: Partial<Menu>,
    MenuPageAssociations: Partial<MenuPageAssociation>[]
  ): Promise<Menu> {
    const trx=await db.transaction();
    try {
      const now = new Date().toISOString();
      const updatedMenu = (await trx("menus")
        .where("id", id)
        .update({
          ...updates,
          updatedAt: now,
        }).returning("*"))[0] as Menu;
        const existingAssociations = await trx("menu_page_associations")
        .where("menuId", id)
        .select("id");
        const providedItemIds = new Set(
          MenuPageAssociations.map((item) => item.id).filter((id) => id))
        const toDelete = existingAssociations
          .map((item) => item.id)
          .filter((id) => !providedItemIds.has(id));
        if (toDelete.length > 0) {
          await trx("menu_page_associations").whereIn("id", toDelete).delete();
        }
        for (const association of MenuPageAssociations) {
          const existingAssociations= await trx("menu_page_associations")
            .where("id", association.id)
            .andWhere("menuId", id)
            .andWhere("menuPageId", association.menuPageId)
            .first();
            if (existingAssociations) {
              await trx("menu_page_associations")
                .where("id", existingAssociations.id)
                .update({
                  ...association,
                  updatedAt: now,
                });
            }else{
              const newAssociation = {
                ...association,
                id: randomUUID(),
                menuId: id,
                createdAt: now,
                updatedAt: now,
              };
              await trx("menu_page_associations").insert(newAssociation);
            }
        }

      await trx.commit();
      return updatedMenu;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async deleteMenu(id: string): Promise<void> {
    try {
      await db("menus").where("id", id).delete();
      Logger.info(`Menu deleted: ${id}`);
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

}
