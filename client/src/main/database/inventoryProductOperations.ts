import { randomUUID } from "crypto";
import { db } from "./index.js";

export class InventoryProductDatabaseOperations {
  static async createInventoryProduct(inventoryProductData: any) {
    try {
      const existingProduct = await db("inventory_products")
        .where("name", inventoryProductData.name)
        .first();
      if (existingProduct) {
        throw new Error("Inventory product with the same name already exists.");
      }
      const now = new Date().toISOString();
      const newProduct = {
        id: randomUUID(),
        ...inventoryProductData,
        createdAt: now,
        updatedAt: now,
      };
      await db("inventory_products").insert(newProduct);
      return newProduct;
    } catch (error) {
      throw error;
    }
  }

  static async updateInventoryProduct(
    productId: string,
    inventoryProductData: any
  ) {
    try {
      const existingProduct = await db("inventory_products")
        .where("name", inventoryProductData.name)
        .whereNot("id", productId)
        .first();
      if (existingProduct) {
        throw new Error("Inventory product with the same name already exists.");
      }
      const now = new Date().toISOString();
      const updatedProduct = {
        ...inventoryProductData,
        updatedAt: now,
      };
      await db("inventory_products")
        .where("id", productId)
        .update(updatedProduct);
      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  static async deleteInventoryProduct(productId: string) {
    try {
      await db("inventory_products").where("id", productId).delete();
    } catch (error) {
      throw error;
    }
  }

  static async getAllInventoryProducts() {
    try {
      const products = await db("inventory_products")
        .leftJoin(
          "expense_types",
          "inventory_products.expenseTypeId",
          "expense_types.id"
        )
        .select(
          "inventory_products.*",
          "expense_types.name as expenseTypeName",
          "expense_types.id as expenseTypeId_ref"
        )
        .orderBy("inventory_products.name", "asc");

      return products.map((product) => ({
        ...product,
        expenseType: product.expenseTypeName
          ? {
              id: product.expenseTypeId_ref,
              name: product.expenseTypeName,
            }
          : undefined,
        expenseTypeId: product.expenseTypeId || undefined,
        expenseTypeName: undefined,
        expenseTypeId_ref: undefined,
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getInventoryProductsByExpenseType(expenseTypeId: string) {
    try {
      const products = await db("inventory_products")
        .leftJoin(
          "expense_types",
          "inventory_products.expenseTypeId",
          "expense_types.id"
        )
        .select(
          "inventory_products.*",
          "expense_types.name as expenseTypeName",
          "expense_types.id as expenseTypeId_ref"
        )
        .where("inventory_products.expenseTypeId", expenseTypeId)
        .orderBy("inventory_products.name", "asc");

      return products.map((product) => ({
        ...product,
        expenseType: product.expenseTypeName
          ? {
              id: product.expenseTypeId_ref,
              name: product.expenseTypeName,
            }
          : undefined,
        expenseTypeId: product.expenseTypeId || undefined,
        expenseTypeName: undefined,
        expenseTypeId_ref: undefined,
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getInventoryProductById(productId: string) {
    try {
      const product = await db("inventory_products")
        .where("id", productId)
        .first();
      return product;
    } catch (error) {
      throw error;
    }
  }
}
