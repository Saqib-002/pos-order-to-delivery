import { randomUUID } from "crypto";
import { db } from "./index.js";
import { Income, IncomeFilters, PaginatedResult } from "@/types/incomes.js";

export class OtherIncomeDatabaseOperations {
  static async createOtherIncome(otherIncomesData: Income): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const newIncome = {
        id: randomUUID(),
        name: otherIncomesData.name,
        description: otherIncomesData.description || undefined,
        total: otherIncomesData.total,
        paymentType: otherIncomesData.paymentType,
        date: otherIncomesData.date,
        ticketId: otherIncomesData.ticketId || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await db("other_incomes").insert(newIncome);
      return newIncome;
    } catch (error) {
      throw error;
    }
  }

  static async updateOtherIncome(
    id: string,
    IncomeData: Partial<Income>
  ): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const { id: _id, createdAt, ...updates } = IncomeData as any;
      await db("other_incomes")
        .where("id", id)
        .update({ ...updates, updatedAt: now });
      return await db("other_incomes").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async getOtherIncomes(
    filters: IncomeFilters
  ): Promise<PaginatedResult<Income>> {
    try {
      const { page = 1, pageSize = 10, search, startDate, endDate } = filters;
      const query = db("other_incomes");

      if (search) {
        query.where((builder) => {
          builder
            .whereILike("name", `%${search}%`)
            .orWhereILike("description", `%${search}%`)
            .orWhereILike("ticketId", `%${search}%`);
        });
      }

      if (startDate) {
        query.where("date", ">=", startDate);
      }
      if (endDate) {
        query.where("date", "<=", endDate);
      }

      const countQuery = query
        .clone()
        .clearSelect()
        .count<{ count: number }>("id as count")
        .first();
      const totalResult = await countQuery;
      const total = Number(totalResult?.count || 0);

      const offset = (page - 1) * pageSize;
      const Incomes = await query
        .orderBy("date", "desc")
        .limit(pageSize)
        .offset(offset);

      return {
        data: Incomes,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getOtherIncomeById(id: string): Promise<Income | null> {
    try {
      return await db("other_incomes").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteOtherIncome(id: string): Promise<void> {
    try {
      await db("other_incomes").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }
}