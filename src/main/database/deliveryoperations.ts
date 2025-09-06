import { localDb } from "./index.js";
import { DeliveryPerson } from "@/types/delivery";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class DeliveryDatabaseOperations {
    // Create a new delivery person
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
            console.log(newDeliveryPerson);

            await localDb("delivery_persons").insert(newDeliveryPerson);
            Logger.info(`Delivery person created: ${newDeliveryPerson.name}`);
            return newDeliveryPerson;
        } catch (error) {
            throw error;
        }
    }

    // Get all delivery persons
    static async getDeliveryPersons(): Promise<DeliveryPerson[]> {
        try {
            let query = localDb("delivery_persons")
                .where("isDeleted", false)
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
            const stats = await await localDb("orders")
                .where("deliveryPersonId", deliveryPersonId)
                .andWhere("isDeleted", false)
                .select(
                    localDb.raw("COUNT(*) as totalAssigned"),
                    localDb.raw(
                        "COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as totalDelivered"
                    ),
                    localDb.raw(
                        "COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as totalCancelled"
                    ),
                    localDb.raw(`
                          AVG(
                            CASE 
                              WHEN status = 'Delivered' AND assignedAt IS NOT NULL AND deliveredAt IS NOT NULL 
                              THEN (JULIANDAY(deliveredAt) - JULIANDAY(assignedAt)) * 1440
                            END
                          ) as avgDeliveryTime
                        `)
                )
                .first();

            return {
                totalAssigned: stats.totalAssigned || 0,
                totalDelivered: stats.totalDelivered || 0,
                totalCancelled: stats.totalCancelled || 0,
                avgDeliveryTime: stats.avgDeliveryTime || 0,
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

            await localDb("delivery_persons")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                    syncedAt: null,
                });

            const updatedPerson = await localDb("delivery_persons")
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
            const now = new Date().toISOString();

            await localDb("delivery_persons").where("id", id).update({
                isDeleted: true,
                updatedAt: now,
                syncedAt: null,
            });

            Logger.info(`Delivery person deleted: ${id}`);
        } catch (error) {
            throw error;
        }
    }

    // Assign delivery person to order
    static async assignDeliveryPerson(
        orderId: string,
        deliveryPersonId: string
    ): Promise<void> {
        const trx = await localDb.transaction();
        try {
            const now = new Date().toISOString();

            // Update the order with delivery person assignment
            await trx("orders").where("id", orderId).update({
                deliveryPersonId: deliveryPersonId,
                assignedAt: now,
                status: "Out for Delivery",
                updatedAt: now,
                syncedAt: null,
            });

            // Update delivery person's total deliveries count
            await trx("delivery_persons")
                .where("id", deliveryPersonId)
                .increment("totalDeliveries", 1)
                .update({
                    updatedAt: now,
                    syncedAt: null,
                });

            await trx.commit();
            Logger.info(
                `Delivery person ${deliveryPersonId} assigned to order ${orderId}`
            );
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // Mark order as picked up
    static async markOrderPickedUp(orderId: string): Promise<void> {
        try {
            const now = new Date().toISOString();

            await localDb("orders").where("id", orderId).update({
                pickedUpAt: now,
                updatedAt: now,
                syncedAt: null,
            });

            Logger.info(`Order ${orderId} marked as picked up`);
        } catch (error) {
            throw error;
        }
    }

    // Get orders assigned to a delivery person
    static async getOrdersByDeliveryPerson(
        deliveryPersonId: string
    ): Promise<any[]> {
        try {
            const orders = await localDb("orders")
                .where("deliveryPersonId", deliveryPersonId)
                .andWhere("isDeleted", false)
                .whereIn("status", ["Out for Delivery", "Picked Up"])
                .orderBy("assignedAt", "desc");

            return orders;
        } catch (error) {
            throw error;
        }
    }

    // Get delivery statistics for a person

    // Get available delivery persons (active and not currently delivering too many orders)
    static async getAvailableDeliveryPersons(
        maxConcurrentDeliveries: number = 3
    ): Promise<DeliveryPerson[]> {
        try {
            // First get all active delivery persons
            const activePersons = await localDb("delivery_persons")
                .where("isActive", true)
                .andWhere("isDeleted", false);

            // Then check their current delivery load
            const availablePersons = [];

            for (const person of activePersons) {
                const currentDeliveries = await localDb("orders")
                    .where("deliveryPersonId", person.id)
                    .whereIn("status", ["Out for Delivery", "Picked Up"])
                    .count("* as count")
                    .first();

                if (
                    ((currentDeliveries?.count as number) || 0) <
                    maxConcurrentDeliveries
                ) {
                    availablePersons.push(person);
                }
            }

            return availablePersons;
        } catch (error) {
            throw error;
        }
    }
}
