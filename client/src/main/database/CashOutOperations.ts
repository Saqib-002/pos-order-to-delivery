import { randomUUID } from "crypto";
import { db } from "./index.js";
import { Income, IncomeFilters, PaginatedResult } from "@/types/incomes.js";

export class CashOutDatabaseOperations {
  static async createCashOut(cashOutData: Income): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const newTransaction = {
        id: randomUUID(),
        name: cashOutData.name,
        description: cashOutData.description || undefined,
        total: cashOutData.total,
        paymentType: cashOutData.paymentType || 'cash',
        date: cashOutData.date,
        ticketId: cashOutData.ticketId || undefined,
        created_at: now,
        updated_at: now,
      };

      await db("cash_out_transactions").insert(newTransaction);
      return {
        ...newTransaction,
      } as any;
    } catch (error) {
      throw error;
    }
  }

  static async updateCashOut(id: string, data: Partial<Income>): Promise<Income> {
    try {
      const now = new Date().toISOString();
      const updates = {
        ...data,
        updated_at: now,
      };

      await db("cash_out_transactions").where("id", id).update(updates);
      return await db("cash_out_transactions").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async getCashOuts(filters: IncomeFilters): Promise<PaginatedResult<Income>> {
    try {
      const { page = 1, pageSize = 10, search, startDate, endDate } = filters;
      const query = db("cash_out_transactions");

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

      const totalResult = await query.clone().count<{ count: number }>("id as count").first();
      const total = Number(totalResult?.count || 0);

      const offset = (page - 1) * pageSize;
      const data = await query.orderBy("date", "desc").limit(pageSize).offset(offset);

      return {
        data,
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

  static async deleteCashOut(id: string): Promise<void> {
    try {
      await db("cash_out_transactions").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }
}
