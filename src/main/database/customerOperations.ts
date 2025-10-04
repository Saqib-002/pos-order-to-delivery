import { randomUUID } from "crypto";
import { db } from "./index.js";
import { Customer } from "@/types/order.js";

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
  static async getCustomersByPhone(phone: string) {
    try {
      const customers = await db("customers").whereLike("phone", `%${phone}%`);
      return customers || null;
    } catch (error) {
      throw error;
    }
  }
  static async upsertCustomer(customer: Partial<Customer>) {
    try {
      const existingCustomer = await db("customers")
        .where("phone", customer.phone)
        .first();
      if (existingCustomer) {
        await db("customers")
          .where("id", existingCustomer.id)
          .update({
            ...customer,
            updatedAt: new Date().toISOString(),
          });
        return existingCustomer;
      } else {
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
      }
    } catch (error) {
      throw error;
    }
  }
}
