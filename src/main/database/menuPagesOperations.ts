import { db } from "./index.js";
import {
  MenuPage,
  MenuPageProduct,
  MenuPageAssociation,
} from "@/types/menuPages.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class MenuPagesOperations {
  // Menu Pages CRUD Operations
  static async createMenuPage(
    menuPage: Omit<MenuPage, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<MenuPage> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newMenuPage = {
        id,
        ...menuPage,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      await db("menu_pages").insert(newMenuPage);
      Logger.info(`Menu page created: ${newMenuPage.name}`);
      return newMenuPage;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuPages(): Promise<MenuPage[]> {
    try {
      const menuPages = await db("menu_pages")
        .where("isDeleted", false)
        .orderBy("name", "asc");
      return menuPages;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuPageById(id: string): Promise<MenuPage | null> {
    try {
      const menuPage = await db("menu_pages")
        .where("id", id)
        .andWhere("isDeleted", false)
        .first();
      return menuPage || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateMenuPage(
    id: string,
    updates: Partial<MenuPage>
  ): Promise<MenuPage> {
    try {
      const now = new Date().toISOString();
      await db("menu_pages")
        .where("id", id)
        .update({
          ...updates,
          updatedAt: now,
        });

      const updatedMenuPage = await db("menu_pages").where("id", id).first();
      if (!updatedMenuPage) {
        throw new Error("Menu page not found after update");
      }

      Logger.info(`Menu page updated: ${id}`);
      return updatedMenuPage;
    } catch (error) {
      throw error;
    }
  }

  static async deleteMenuPage(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db("menu_pages").where("id", id).update({
        isDeleted: true,
        updatedAt: now,
      });
      Logger.info(`Menu page deleted: ${id}`);
    } catch (error) {
      throw error;
    }
  }

  // Menu Page Products Operations
  static async addProductToMenuPage(
    menuPageId: string,
    productId: string,
    productName: string,
    supplement: number = 0,
    priority: number = 0
  ): Promise<MenuPageProduct> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const menuPageProduct = {
        id,
        menuPageId,
        productId,
        productName,
        supplement,
        priority,
        createdAt: now,
        updatedAt: now,
      };
      await db("menu_page_products").insert(menuPageProduct);
      Logger.info(`Product added to menu page: ${productName}`);
      return menuPageProduct;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuPageProducts(
    menuPageId: string
  ): Promise<MenuPageProduct[]> {
    try {
      const products = await db("menu_page_products")
        .where("menuPageId", menuPageId)
        .orderBy("priority", "asc");
      return products;
    } catch (error) {
      throw error;
    }
  }

  static async removeProductFromMenuPage(
    menuPageId: string,
    productId: string
  ): Promise<void> {
    try {
      await db("menu_page_products")
        .where("menuPageId", menuPageId)
        .andWhere("productId", productId)
        .delete();
      Logger.info(`Product removed from menu page: ${productId}`);
    } catch (error) {
      throw error;
    }
  }

  static async updateMenuPageProduct(
    id: string,
    updates: Partial<MenuPageProduct>
  ): Promise<MenuPageProduct> {
    try {
      const now = new Date().toISOString();
      await db("menu_page_products")
        .where("id", id)
        .update({
          ...updates,
          updatedAt: now,
        });

      const updatedProduct = await db("menu_page_products")
        .where("id", id)
        .first();
      if (!updatedProduct) {
        throw new Error("Menu page product not found after update");
      }

      Logger.info(`Menu page product updated: ${id}`);
      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }
}
