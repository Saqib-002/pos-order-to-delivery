import { randomUUID } from "crypto";
import { db } from "./index.js";
import { Income, IncomeFilters, PaginatedResult } from "@/types/incomes.js";

export class ExpenseDatabaseOperations {
  static async createExpense(expenseData: Income): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const newExpense = {
        id: randomUUID(),
        name: expenseData.name,
        description: expenseData.description || undefined,
        total: expenseData.total,
        paymentType: expenseData.paymentType,
        date: expenseData.date,
        ticketId: expenseData.ticketId || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await db("expenses").insert(newExpense);
      return newExpense;
    } catch (error) {
      throw error;
    }
  }

  static async updateExpense(
    id: string,
    expenseData: Partial<Income>
  ): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const { id: _id, createdAt, ...updates } = expenseData as any;
      await db("expenses")
        .where("id", id)
        .update({ ...updates, updatedAt: now });
      return await db("expenses").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async getExpenses(
    filters: IncomeFilters
  ): Promise<PaginatedResult<Income>> {
    try {
      const { page = 1, pageSize = 10, search, startDate, endDate } = filters;
      const query = db("expenses");

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
      const expenses = await query
        .orderBy("date", "desc")
        .limit(pageSize)
        .offset(offset);

      return {
        data: expenses,
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

  static async getExpenseById(id: string): Promise<Income | null> {
    try {
      return await db("expenses").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      await db("expenses").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }
}
