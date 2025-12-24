import { randomUUID } from "crypto";
import { db } from "./index.js";

export class ExpenseTypeDatabaseOperations {
  static async createExpenseType(expenseTypeData: any) {
    try {
      const existingExpenseType = await db("expense_types")
        .where("name", expenseTypeData.name)
        .first();
      if (existingExpenseType) {
        throw new Error("Expense type with the same name already exists.");
      }
      const now = new Date().toISOString();
      const newExpenseType = {
        id: randomUUID(),
        ...expenseTypeData,
        createdAt: now,
        updatedAt: now,
      };
      await db("expense_types").insert(newExpenseType);
      return newExpenseType;
    } catch (error) {
      throw error;
    }
  }

  static async updateExpenseType(expenseTypeId: string, expenseTypeData: any) {
    try {
      const existingExpenseType = await db("expense_types")
        .where("name", expenseTypeData.name)
        .whereNot("id", expenseTypeId)
        .first();
      if (existingExpenseType) {
        throw new Error("Expense type with the same name already exists.");
      }
      const now = new Date().toISOString();
      const updatedExpenseType = {
        ...expenseTypeData,
        updatedAt: now,
      };
      await db("expense_types")
        .where("id", expenseTypeId)
        .update(updatedExpenseType);
      return updatedExpenseType;
    } catch (error) {
      throw error;
    }
  }

  static async deleteExpenseType(expenseTypeId: string) {
    try {
      await db("expense_types").where("id", expenseTypeId).delete();
    } catch (error) {
      throw error;
    }
  }

  static async getAllExpenseTypes() {
    try {
      const expenseTypes = await db("expense_types").orderBy("name", "asc");
      return expenseTypes;
    } catch (error) {
      throw error;
    }
  }

  static async getExpenseTypeById(expenseTypeId: string) {
    try {
      const expenseType = await db("expense_types")
        .where("id", expenseTypeId)
        .first();
      return expenseType;
    } catch (error) {
      throw error;
    }
  }
}
