import { db } from "./index.js";
import {
  MaintenanceFilters,
  PaginatedResult,
  Vehicle,
  VehicleFilters,
  VehicleMaintenance,
} from "@/types/vehicles";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class VehicleDatabaseOperations {
  // --- Vehicles ---

  static async createVehicle(
    vehicleData: Omit<
      Vehicle,
      "id" | "createdAt" | "updatedAt" | "alerts" | "driverName"
    >
  ): Promise<Vehicle> {
    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      const newVehicle = {
        id,
        ...vehicleData,
        createdAt: now,
        updatedAt: now,
      };
      await db("vehicles").insert(newVehicle);
      return newVehicle;
    } catch (error) {
      throw error;
    }
  }

  static async getVehicles(
    filters: VehicleFilters
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const {
        page = 1,
        pageSize = 10,
        search,
        type,
        hasGps,
        driverId,
        alertStatus,
      } = filters;

      const query = db("vehicles")
        .leftJoin(
          "delivery_persons",
          "vehicles.driverId",
          "delivery_persons.id"
        )
        .select("vehicles.*", "delivery_persons.name as driverName");

      // --- Apply Filters ---

      if (search) {
        query.where((builder) => {
          builder
            .whereILike("vehicles.model", `%${search}%`)
            .orWhereILike("vehicles.licensePlate", `%${search}%`);
        });
      }

      if (type && type !== "all") {
        query.where("vehicles.type", type);
      }

      if (hasGps !== null && hasGps !== undefined) {
        query.where("vehicles.hasGps", hasGps);
      }

      if (driverId) {
        if (driverId === "unassigned") {
          query.whereNull("vehicles.driverId");
        } else {
          query.where("vehicles.driverId", driverId);
        }
      }

      // Advanced Alert Filtering (Backend Logic)
      const now = new Date();
      const oneWeek = new Date();
      oneWeek.setDate(now.getDate() + 7);
      const nowStr = now.toISOString();
      const oneWeekStr = oneWeek.toISOString();

      if (alertStatus && alertStatus !== "all") {
        query.where((builder) => {
          if (alertStatus === "expired") {
            builder
              .where("vehicles.itvDate", "<", nowStr)
              .orWhere("vehicles.insuranceDate", "<", nowStr);
          } else if (alertStatus === "expiring_soon") {
            builder
              .whereBetween("vehicles.itvDate", [nowStr, oneWeekStr])
              .orWhereBetween("vehicles.insuranceDate", [nowStr, oneWeekStr]);
          } else if (alertStatus === "has_alerts") {
            // Includes both expired and expiring soon
            builder
              .where("vehicles.itvDate", "<=", oneWeekStr)
              .orWhere("vehicles.insuranceDate", "<=", oneWeekStr);
          }
        });
      }

      // --- Pagination ---

      // Get Total Count first
      const countQuery = query
        .clone()
        .clearSelect()
        .count<{ count: number }>("vehicles.id as count")
        .first();
      const totalResult = await countQuery;
      const total = Number(totalResult?.count || 0);

      // Get Data
      const offset = (page - 1) * pageSize;
      const vehicles = await query
        .orderBy("vehicles.createdAt", "desc")
        .limit(pageSize)
        .offset(offset);

      const processedVehicles = vehicles.map((v: any) => {
        const alerts: string[] = [];
        const checkDate = (dateStr: string, name: string) => {
          if (!dateStr) return;
          const d = new Date(dateStr);
          if (d < now) alerts.push(`${name} Expired`);
          else if (d <= oneWeek) alerts.push(`${name} Expiring soon`);
        };
        checkDate(v.itvDate, "ITV");
        checkDate(v.insuranceDate, "Insurance");

        return { ...v, hasGps: Boolean(v.hasGps), alerts };
      });

      return {
        data: processedVehicles,
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

  static async updateVehicle(
    id: string,
    updates: Partial<Vehicle>
  ): Promise<Vehicle> {
    try {
      const now = new Date().toISOString();
      const {
        driverName,
        alerts,
        id: _id,
        createdAt,
        ...validUpdates
      } = updates as any;
      if (validUpdates.driverId === "") {
        validUpdates.driverId = null;
      }
      await db("vehicles")
        .where("id", id)
        .update({ ...validUpdates, updatedAt: now });
      return await db("vehicles").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteVehicle(id: string): Promise<void> {
    try {
      await db("vehicles").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }

  // --- Maintenance ---

  static async addMaintenanceRecord(
    data: Omit<VehicleMaintenance, "id">
  ): Promise<VehicleMaintenance> {
    try {
      const id = randomUUID();
      const record = { id, ...data };
      await db("vehicle_maintenance").insert(record);
      return record;
    } catch (error) {
      throw error;
    }
  }

  static async addMultipleMaintenanceRecords(
    records: Omit<VehicleMaintenance, "id">[]
  ): Promise<VehicleMaintenance[]> {
    const trx = await db.transaction();
    try {
      const recordsWithIds = records.map((r) => ({
        id: randomUUID(),
        ...r,
      }));
      await trx("vehicle_maintenance").insert(recordsWithIds);
      await trx.commit();
      return recordsWithIds;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async updateMultipleMaintenancePayments(
    maintenanceIds: string[],
    paymentType: string
  ): Promise<void> {
    const trx = await db.transaction();
    try {
      // 1. Fetch the records to know their totals
      const records = await trx("vehicle_maintenance")
        .whereIn("id", maintenanceIds)
        .select("id", "total");

      // 2. Parse the total payment amount from the string
      // Support both comma and semicolon separators
      const separators = /[,;]\s*/;
      const payments = paymentType.split(separators).filter(p => p.trim() !== "").map(p => {
        const [, amount] = p.split(":");
        return { type: p.split(":")[0]?.trim() || "unknown", amount: parseFloat(amount) || 0 };
      });

      // Keep track of remaining funds from each payment method
      let remainingPayments = payments.map(p => ({ ...p }));
      let totalFunds = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Distribute funds sequentially across records
      for (const recordId of maintenanceIds) {
        const record = records.find(r => r.id === recordId);
        if (!record) continue;

        const recordTotal = parseFloat(String(record.total)) || 0;
        let recordPaymentParts: string[] = [];
        let recordRemainingToPay = recordTotal;

        for (const method of remainingPayments) {
          if (recordRemainingToPay <= 0) break;
          if (method.amount <= 0) continue;

          const amountToTake = Math.min(recordRemainingToPay, method.amount);
          if (amountToTake > 0) {
            recordPaymentParts.push(`${method.type}:${amountToTake.toFixed(2)}`);
            method.amount -= amountToTake;
            recordRemainingToPay -= amountToTake;
          }
        }

        const recordPaymentString = recordPaymentParts.join(", ");
        await trx("vehicle_maintenance")
          .where("id", record.id)
          .update({ paymentType: recordPaymentString });
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  static async updateMaintenanceRecord(
    id: string,
    updates: Partial<VehicleMaintenance>
  ): Promise<VehicleMaintenance> {
    try {
      await db("vehicle_maintenance").where("id", id).update(updates);
      return await db("vehicle_maintenance").where("id", id).first();
    } catch (error) {
      throw error;
    }
  }

  static async deleteMaintenanceRecord(id: string): Promise<void> {
    try {
      await db("vehicle_maintenance").where("id", id).delete();
    } catch (error) {
      throw error;
    }
  }

  static async getMaintenanceRecords(
    vehicleId: string,
    filters: MaintenanceFilters
  ): Promise<PaginatedResult<VehicleMaintenance>> {
    try {
      const {
        page = 1,
        pageSize = 10,
        search,
        startDate,
        endDate,
        minPrice,
        maxPrice,
      } = filters;

      const query = db("vehicle_maintenance").where("vehicleId", vehicleId);

      if (search) {
        query.whereILike("sparePart", `%${search}%`);
      }
      if (startDate) {
        query.where("date", ">=", startDate);
      }
      if (endDate) {
        query.where("date", "<=", endDate);
      }
      if (minPrice !== undefined) {
        query.where("total", ">=", minPrice);
      }
      if (maxPrice !== undefined) {
        query.where("total", "<=", maxPrice);
      }

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
}
