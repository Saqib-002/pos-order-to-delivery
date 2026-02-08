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
      const customers = await db("customers")
        .whereLike("phone", `%${phone}%`)
        .orWhereLike("name", `%${phone}%`);
      return customers || null;
    } catch (error) {
      throw error;
    }
  }
  static async getCustomerByPhone(phone: string) {
    try {
      const customer = await db("customers").where("phone", phone).first();
      return customer || null;
    } catch (error) {
      throw error;
    }
  }
  static async getAllCustomers(page = 0, limit = 20, searchTerm = "") {
    try {
      let query = db("customers");

      if (searchTerm) {
        query = query.where((qb) => {
          qb.whereLike("name", `%${searchTerm}%`)
            .orWhereLike("phone", `%${searchTerm}%`)
            .orWhereLike("email", `%${searchTerm}%`)
            .orWhereLike("address", `%${searchTerm}%`);
        });
      }

      const totalCountRes = await query.clone().count("id as count").first();
      const totalCount = Number(totalCountRes?.count || 0);

      const withEmailCountRes = await query
        .clone()
        .whereNotNull("email")
        .whereNot("email", "")
        .count("id as count")
        .first();
      const withEmailCount = Number(withEmailCountRes?.count || 0);

      const withAddressCountRes = await query
        .clone()
        .whereNotNull("address")
        .whereNot("address", "")
        .count("id as count")
        .first();
      const withAddressCount = Number(withAddressCountRes?.count || 0);

      const customers = await query
        .select("*")
        .orderBy("name", "asc")
        .limit(limit)
        .offset(page * limit);

      return {
        customers: customers || [],
        totalCount,
        withEmailCount,
        withAddressCount,
      };
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
  static async getCustomerById(customerId: string) {
    try {
      const customer = await db("customers").where("id", customerId).first();
      return customer || null;
    } catch (error) {
      throw error;
    }
  }
  static async updateCustomer(customerId: string, customer: Partial<Customer>) {
    try {
      await db("customers")
        .where("id", customerId)
        .update({
          ...customer,
          updatedAt: new Date().toISOString(),
        });
      const updatedCustomer = await db("customers")
        .where("id", customerId)
        .first();
      return updatedCustomer;
    } catch (error) {
      throw error;
    }
  }
  static async deleteCustomer(customerId: string) {
    try {
      await db("customers").where("id", customerId).delete();
    } catch (error) {
      throw error;
    }
  }
}
