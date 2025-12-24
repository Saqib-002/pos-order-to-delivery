import { randomUUID } from "crypto";
import { db } from "./index.js";

export class SupplierDatabaseOperations {
  static async createSupplier(supplierData: any) {
    try {
      const existingSupplier = await db("suppliers")
        .where("name", supplierData.name)
        .first();
      if (existingSupplier) {
        throw new Error("Supplier with the same name already exists.");
      }
      const now = new Date().toISOString();
      const newSupplier = {
        id: randomUUID(),
        ...supplierData,
        createdAt: now,
        updatedAt: now,
      };
      await db("suppliers").insert(newSupplier);
      return newSupplier;
    } catch (error) {
      throw error;
    }
  }

  static async updateSupplier(supplierId: string, supplierData: any) {
    try {
      const existingSupplier = await db("suppliers")
        .where("name", supplierData.name)
        .whereNot("id", supplierId)
        .first();
      if (existingSupplier) {
        throw new Error("Supplier with the same name already exists.");
      }
      const now = new Date().toISOString();
      const updatedSupplier = {
        ...supplierData,
        updatedAt: now,
      };
      await db("suppliers").where("id", supplierId).update(updatedSupplier);
      return updatedSupplier;
    } catch (error) {
      throw error;
    }
  }

  static async deleteSupplier(supplierId: string) {
    try {
      await db("suppliers").where("id", supplierId).delete();
    } catch (error) {
      throw error;
    }
  }

  static async getAllSuppliers() {
    try {
      const suppliers = await db("suppliers").orderBy("name", "asc");
      return suppliers;
    } catch (error) {
      throw error;
    }
  }

  static async getSupplierById(supplierId: string) {
    try {
      const supplier = await db("suppliers").where("id", supplierId).first();
      return supplier;
    } catch (error) {
      throw error;
    }
  }
}
