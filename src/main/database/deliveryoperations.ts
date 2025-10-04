import { db } from "./index.js";
import { DeliveryPerson } from "@/types/delivery";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class DeliveryDatabaseOperations {
    static async createDeliveryPerson(
        deliveryPersonData: Omit<
            DeliveryPerson,
            "id" | "createdAt" | "updatedAt"
        >
    ): Promise<DeliveryPerson> {
        try {
            const now = new Date().toISOString();
            const id = randomUUID();

            const newDeliveryPerson = {
                id,
                ...deliveryPersonData,
                createdAt: now,
                updatedAt: now,
            };
            await db("delivery_persons").insert(newDeliveryPerson);
            return newDeliveryPerson;
        } catch (error) {
            throw error;
        }
    }

    static async getDeliveryPersons(): Promise<DeliveryPerson[]> {
        try {
            let query = db("delivery_persons")
                .orderBy("name", "asc");
            const deliveryPersons = await query;
            const deliveryPersonsWithStats = await Promise.all(
                deliveryPersons.map(async (person) => {
                    const stats = await this.getDeliveryPersonStats(person.id);
                    return { ...person, ...stats };
                })
            );
            return deliveryPersonsWithStats;
        } catch (error) {
            throw error;
        }
    }
    static async getDeliveryPersonStats(
        deliveryPersonId: string
    ): Promise<any> {
        try {
            const stats = await db("orders")
                .where("deliveryPersonId", deliveryPersonId)
                .select(
                    db.raw(`COUNT(*) as "totalAssigned"`),
                    db.raw(
                        `COUNT(CASE WHEN LOWER(status) = LOWER('Delivered') THEN 1 END) as "totalDelivered"`
                    ),
                    db.raw(
                        `COUNT(CASE WHEN LOWER(status) = LOWER('Cancelled') THEN 1 END) as "totalCancelled"`
                    ),
                    db.raw(`
                          AVG(
                            CASE 
                              WHEN LOWER(status) = LOWER('Delivered') AND "assignedAt" IS NOT NULL AND "deliveredAt" IS NOT NULL 
                              THEN EXTRACT(EPOCH FROM ("deliveredAt" - "assignedAt")) / 60
                            END
                          ) as "avgDeliveryTime"
                        `)
                )
                .first();

            return {
                totalAssigned: parseFloat(stats.totalAssigned) || 0,
                totalDelivered: parseFloat(stats.totalDelivered) || 0,
                totalCancelled: parseFloat(stats.totalCancelled) || 0,
                avgDeliveryTime: parseFloat(stats.avgDeliveryTime) || 0,
            };
        } catch (error) {
            throw error;
        }
    }

    // Update delivery person
    static async updateDeliveryPerson(
        id: string,
        updates: Partial<DeliveryPerson>
    ): Promise<DeliveryPerson> {
        try {
            const now = new Date().toISOString();

            await db("delivery_persons")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                });

            const updatedPerson = await db("delivery_persons")
                .where("id", id)
                .first();

            if (!updatedPerson) {
                throw new Error("Delivery person not found after update");
            }

            Logger.info(`Delivery person updated: ${id}`);
            return updatedPerson;
        } catch (error) {
            throw error;
        }
    }

    // Delete delivery person (soft delete)
    static async deleteDeliveryPerson(id: string): Promise<void> {
        try {
            await db("delivery_persons").where("id", id).delete();
        } catch (error) {
            throw error;
        }
    }

    static async assignDeliveryPerson(
        orderId: string,
        deliveryPersonId: string
    ): Promise<void> {
        try {
            const now = new Date().toISOString();
            // Update the order with delivery person assignment
            await db("orders").where("id", orderId).update({
                deliveryPersonId: deliveryPersonId,
                assignedAt: now,
                status: "Out for Delivery",
                updatedAt: now,
            });
        } catch (error) {
            throw error;
        }
    }
}
