import { randomUUID } from "crypto";
import { db } from "./index.js";

export interface IncomeSource {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class IncomeSourceDatabaseOperations {
  static async createIncomeSource(
    incomeSourceData: Omit<IncomeSource, "id" | "created_at" | "updated_at">
  ): Promise<IncomeSource> {
    try {
      const id = randomUUID();
      const now = new Date().toISOString();

      const newIncomeSource = {
        id,
        name: incomeSourceData.name,
        description: incomeSourceData.description || null,
        is_active: incomeSourceData.is_active ?? true,
        created_at: now,
        updated_at: now,
      };

      await db("income_sources").insert(newIncomeSource);
      return newIncomeSource;
    } catch (error) {
      throw error;
    }
  }

  static async updateIncomeSource(
    id: string,
    incomeSourceData: Partial<Omit<IncomeSource, "id" | "created_at">>
  ): Promise<IncomeSource> {
    try {
      const now = new Date().toISOString();
      const updates = {
        ...incomeSourceData,
        updated_at: now,
      };

      await db("income_sources").where("id", id).update(updates);

      return await db("income_sources").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async getAllIncomeSources(): Promise<IncomeSource[]> {
    try {
      return await db("income_sources")
        .where("is_active", true)
        .orderBy("name", "asc");
    } catch (error) {
      throw error;
    }
  }

  static async getIncomeSourceById(id: string): Promise<IncomeSource | null> {
    try {
      return await db("income_sources").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteIncomeSource(id: string): Promise<void> {
    try {
      await db("income_sources").where("id", id).update({
        is_active: false,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      throw error;
    }
  }
}
