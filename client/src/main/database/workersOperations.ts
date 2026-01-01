import { db } from "./index.js";
import {
  Worker,
  WorkerFilters,
  WorkerSalary,
  SalaryFilters,
  PaginatedResult,
} from "@/types/workers";
import { randomUUID } from "crypto";

export class WorkerDatabaseOperations {
  // --- Workers ---

  static async createWorker(
    data: Omit<Worker, "id" | "createdAt" | "updatedAt">
  ): Promise<Worker> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newWorker = { id, ...data, createdAt: now, updatedAt: now };
      await db("workers").insert(newWorker);
      return newWorker;
    } catch (error) {
      throw error;
    }
  }

  static async getWorkers(
    filters: WorkerFilters
  ): Promise<PaginatedResult<Worker>> {
    try {
      const { page = 1, pageSize = 10, search, isActive } = filters;
      const query = db("workers");

      if (search) {
        query.where((builder) => {
          builder
            .whereILike("name", `%${search}%`)
            .orWhereILike("idNumber", `%${search}%`);
        });
      }

      if (isActive !== undefined) {
        query.where("isActive", isActive);
      }

      const countQuery = query
        .clone()
        .clearSelect()
        .count<{ count: number }>("id as count")
        .first();
      const totalResult = await countQuery;
      const total = Number(totalResult?.count || 0);

      const offset = (page - 1) * pageSize;
      const workers = await query
        .orderBy("createdAt", "desc")
        .limit(pageSize)
        .offset(offset);

      return {
        data: workers,
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

  static async updateWorker(
    id: string,
    updates: Partial<Worker>
  ): Promise<Worker> {
    try {
      const now = new Date().toISOString();
      const { id: _id, createdAt, ...validUpdates } = updates as any;
      await db("workers")
        .where("id", id)
        .update({ ...validUpdates, updatedAt: now });
      return await db("workers").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteWorker(id: string): Promise<void> {
    try {
      await db("workers").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }

  // --- Salary Records ---

  static async addSalaryRecord(
    data: Omit<WorkerSalary, "id">
  ): Promise<WorkerSalary> {
    try {
      const id = randomUUID();
      const record = { id, ...data };
      await db("worker_salaries").insert(record);
      return record;
    } catch (error) {
      throw error;
    }
  }
  static async updateSalaryRecord(
    id: string,
    updates: Partial<WorkerSalary>
  ): Promise<WorkerSalary> {
    try {
      const { id: _id, createdAt, workerId, ...validUpdates } = updates as any;
      await db("worker_salaries").where("id", id).update(validUpdates);
      return await db("worker_salaries").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async getSalaryRecords(
    workerId: string,
    filters: SalaryFilters
  ): Promise<PaginatedResult<WorkerSalary>> {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = filters;
      const query = db("worker_salaries").where("workerId", workerId);

      if (startDate) query.where("date", ">=", startDate);
      if (endDate) query.where("date", "<=", endDate);

      const countQuery = query
        .clone()
        .clearSelect()
        .count<{ count: number }>("id as count")
        .first();
      const totalResult = await countQuery;
      const total = Number(totalResult?.count || 0);

      const offset = (page - 1) * pageSize;
      const records = await query
        .orderBy("date", "desc")
        .limit(pageSize)
        .offset(offset);

      return {
        data: records,
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

  static async deleteSalaryRecord(id: string): Promise<void> {
    try {
      await db("worker_salaries").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }
}
