import { db } from "./index.js";
import { Vehicle, VehicleMaintenance } from "@/types/vehicles";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class VehicleDatabaseOperations {
    // --- Vehicles ---

    static async createVehicle(vehicleData: Omit<Vehicle, "id" | "createdAt" | "updatedAt" | "alerts" | "driverName">): Promise<Vehicle> {
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

    static async getVehicles(): Promise<Vehicle[]> {
        try {
            const vehicles = await db("vehicles")
                .leftJoin("delivery_persons", "vehicles.driverId", "delivery_persons.id")
                .select("vehicles.*", "delivery_persons.name as driverName")
                .orderBy("vehicles.createdAt", "desc");

            // Process notifications [cite: 65]
            const now = new Date();
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(now.getDate() + 7);

            return vehicles.map((v: any) => {
                const alerts: string[] = [];
                if (v.itvDate) {
                    const itv = new Date(v.itvDate);
                    if (itv <= oneWeekFromNow && itv >= now) alerts.push("ITV Expiring soon");
                    if (itv < now) alerts.push("ITV Expired");
                }
                if (v.insuranceDate) {
                    const ins = new Date(v.insuranceDate);
                    if (ins <= oneWeekFromNow && ins >= now) alerts.push("Insurance Expiring soon");
                    if (ins < now) alerts.push("Insurance Expired");
                }
                return { ...v, hasGps: Boolean(v.hasGps), alerts };
            });
        } catch (error) {
            throw error;
        }
    }

    static async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
        try {
            const now = new Date().toISOString();
            await db("vehicles").where("id", id).update({ ...updates, updatedAt: now });
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

    static async addMaintenanceRecord(data: Omit<VehicleMaintenance, "id">): Promise<VehicleMaintenance> {
        try {
            const id = randomUUID();
            const record = { id, ...data };
            await db("vehicle_maintenance").insert(record);
            return record;
        } catch (error) {
            throw error;
        }
    }

    static async getMaintenanceRecords(vehicleId: string): Promise<VehicleMaintenance[]> {
        try {
            return await db("vehicle_maintenance").where("vehicleId", vehicleId).orderBy("date", "desc");
        } catch (error) {
            throw error;
        }
    }
}