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
        income_source_id: otherIncomesData.incomeSourceId || null,
        createdAt: now,
        updatedAt: now,
      };

      await db("other_incomes").insert(newIncome);
      return {
        ...newIncome,
        incomeSourceId: newIncome.income_source_id || undefined,
      };
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
      const {
        id: _id,
        createdAt,
        incomeSourceId,
        ...updates
      } = IncomeData as any;

      const dbUpdates = {
        ...updates,
        income_source_id: incomeSourceId || null,
        updatedAt: now,
      };

      await db("other_incomes").where("id", id).update(dbUpdates);

      const updatedIncome = await db("other_incomes").where("id", id).first();
      if (updatedIncome) {
        return {
          ...updatedIncome,
          incomeSourceId: updatedIncome.income_source_id || undefined,
        };
      }
      throw new Error("Income not found after update");
    } catch (error) {
      throw error;
    }
  }

  static async getOtherIncomes(
    filters: IncomeFilters
  ): Promise<PaginatedResult<Income>> {
    try {
      const { page = 1, pageSize = 10, search, startDate, endDate } = filters;
      const baseQuery = db("other_incomes");

      if (search) {
        baseQuery.where((builder) => {
          builder
            .whereILike("name", `%${search}%`)
            .orWhereILike("description", `%${search}%`)
            .orWhereILike("ticketId", `%${search}%`);
        });
      }

      if (startDate) {
        baseQuery.where("date", ">=", startDate);
      }
      if (endDate) {
        baseQuery.where("date", "<=", endDate);
      }

      const countResult = await baseQuery
        .clone()
        .clearSelect()
        .count<{ count: number }>("id as count")
        .first();
      const total = Number(countResult?.count || 0);

      // Fetch all matching records to calculate total and breakdown per payment method
      const allMatching = await baseQuery
        .clone()
        .clearSelect()
        .select("total", "paymentType");

      let totalPaidAmount = 0;
      let totalPendingAmount = 0;
      const paymentMethodTotals: Record<
        string,
        { paid: number; pending: number }
      > = {};

      const addMethodAmount = (
        type: string,
        paid: number,
        pending: number
      ) => {
        const key = (type || "cash").trim();
        if (!paymentMethodTotals[key]) {
          paymentMethodTotals[key] = { paid: 0, pending: 0 };
        }
        paymentMethodTotals[key].paid += paid;
        paymentMethodTotals[key].pending += pending;
        totalPaidAmount += paid;
        totalPendingAmount += pending;
      };

      for (const item of allMatching) {
        const itemTotal = Number(item.total || 0);
        const paymentType = (item.paymentType || "").trim();

        if (!paymentType || paymentType.toLowerCase() === "pending") {
          if (itemTotal > 0) {
            addMethodAmount("cash", 0, itemTotal);
          }
        } else if (paymentType.includes(":")) {
          const separators = /[,;]\s*/;
          const parts = paymentType
            .split(separators)
            .filter((p: string) => p.trim() !== "");
          let itemPaid = 0;
          let primaryType = "cash";

          for (let i = 0; i < parts.length; i++) {
            const [rawType, rawAmt] = parts[i].split(":");
            const type = (rawType || "").trim();
            const amt = parseFloat(rawAmt) || 0;
            if (i === 0 && type) {
              primaryType = type;
            }
            if (type && amt > 0) {
              addMethodAmount(type, amt, 0);
              itemPaid += amt;
            }
          }

          const remaining = Math.round((itemTotal - itemPaid) * 100) / 100;
          if (remaining > 0.01) {
            addMethodAmount(primaryType, 0, remaining);
          }
        } else {
          addMethodAmount(paymentType, itemTotal, 0);
        }
      }

      const totalAmount = Math.round(totalPaidAmount * 100) / 100;
      const roundedPendingAmount = Math.round(totalPendingAmount * 100) / 100;

      const offset = (page - 1) * pageSize;
      const rawIncomes = await baseQuery
        .clone()
        .orderBy("date", "desc")
        .limit(pageSize)
        .offset(offset);

      const Incomes = rawIncomes.map((income: any) => ({
        ...income,
        incomeSourceId: income.income_source_id || undefined,
      }));

      return {
        data: Incomes,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        summary: {
          totalAmount,
          totalPendingAmount: roundedPendingAmount,
          paymentMethodTotals,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getOtherIncomeById(id: string): Promise<Income | null> {
    try {
      const income = await db("other_incomes").where("id", id).first();
      if (income) {
        return {
          ...income,
          incomeSourceId: income.income_source_id || undefined,
        };
      }
      return null;
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
