import { randomUUID } from "crypto";
import { db } from "./index.js";

export class CustomerDatabaseOperations {
    static async createCustomer(
        customer: Omit<Customer, "id" | "createdAt" | "updatedAt">
    ) {
        try {
            const now = new Date().toISOString();
            const id = randomUUID();

            const newCustomer = {
                id,
                ...customer,
                createdAt: now,
                updatedAt: now,
            };

            await db("customers").insert(newCustomer);
            return newCustomer;
        } catch (error) {
            throw error;
        }
    }
}
