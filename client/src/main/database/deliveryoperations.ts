import { db } from "./index.js";
import { DeliveryPerson } from "@/types/delivery";
import { randomUUID } from "crypto";
import Logger from "electron-log";
import {
    enqueueDeliveryPersonDelete,
    enqueueDeliveryPersonUpsert,
} from "../utils/sync/queue/deliveryPersonQueue.js";

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
            const bcrypt = await import("bcrypt");

            let hashedPassword = null;
            if (deliveryPersonData.password) {
                hashedPassword = await bcrypt.hash(deliveryPersonData.password, 10);
            }

            const newDeliveryPerson = {
                id,
                ...deliveryPersonData,
                password: hashedPassword,
                createdAt: now,
                updatedAt: now,
            };
            await db.transaction(async (trx) => {
                await trx("delivery_persons").insert(newDeliveryPerson);
                await enqueueDeliveryPersonUpsert(trx, newDeliveryPerson);
            });
            return {
                ...newDeliveryPerson,
                password: "",
            };
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
            // Never expose the stored bcrypt hash to the renderer. Edit forms
            // should start with an empty password and only submit a new value
            // when the operator intentionally changes it.
            return deliveryPersonsWithStats.map(({ password: _password, ...person }) => ({
                ...person,
                password: "",
            }));
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
            const updateData: any = {
                ...updates,
                updatedAt: now,
            };

            if (updates.password) {
                const bcrypt = await import("bcrypt");
                updateData.password = await bcrypt.hash(updates.password, 10);
            } else if (updates.password === "") {
                delete updateData.password;
            }

            const updatedPerson = await db.transaction(async (trx) => {
                await trx("delivery_persons").where("id", id).update(updateData);

                const person = await trx("delivery_persons").where("id", id).first();
                if (!person) throw new Error("Delivery person not found after update");

                await enqueueDeliveryPersonUpsert(trx, person, {
                    includePassword: Boolean(updates.password),
                });
                return person;
            });

            Logger.info(`Delivery person updated: ${id}`);
            return {
                ...updatedPerson,
                password: "",
            };
        } catch (error) {
            throw error;
        }
    }

    // Delete locally and enqueue a hard delete on the driver server.
    static async deleteDeliveryPerson(id: string): Promise<void> {
        try {
            await db.transaction(async (trx) => {
                const person = await trx("delivery_persons").where("id", id).first("id");
                if (!person) throw new Error("Delivery person not found");

                await trx("delivery_persons").where("id", id).delete();
                await enqueueDeliveryPersonDelete(trx, id);
            });
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
                status: "out for delivery",
                updatedAt: now,
            });
        } catch (error) {
            throw error;
        }
    }
}
