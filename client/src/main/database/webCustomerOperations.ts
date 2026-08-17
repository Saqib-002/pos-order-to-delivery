import { db } from "./index.js";

export interface WebCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  deliveryNotes?: string | null;
  isVerified: boolean;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class WebCustomerDatabaseOperations {
  /**
   * Upsert a web customer synced from the VPS.
   * Uses id as the primary key. Only updates if the incoming record is newer.
   * Syncs ALL fields including deletedAt — the POS mirrors the full VPS state.
   */
  static async upsertWebCustomer(customer: WebCustomer): Promise<void> {
    try {
      const existing = await db("web_customers")
        .where({ id: customer.id })
        .first();

      if (existing) {
        // Normalise both sides to ISO strings before comparing — the DB driver
        // may return updatedAt as a Date object, which breaks JS string comparison.
        const incomingTs = new Date(customer.updatedAt).getTime();
        const existingTs = new Date(existing.updatedAt).getTime();

        if (incomingTs > existingTs) {
          await db("web_customers").where({ id: customer.id }).update({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            password: customer.password,
            address: customer.address ?? null,
            postalCode: customer.postalCode ?? null,
            city: customer.city ?? null,
            deliveryNotes: customer.deliveryNotes ?? null,
            isVerified: customer.isVerified,
            isActive: customer.isActive,
            deletedAt: customer.deletedAt ?? null,
            updatedAt: customer.updatedAt,
          });
        }
      } else {
        await db("web_customers").insert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          password: customer.password,
          address: customer.address ?? null,
          postalCode: customer.postalCode ?? null,
          city: customer.city ?? null,
          deliveryNotes: customer.deliveryNotes ?? null,
          isVerified: customer.isVerified,
          isActive: customer.isActive,
          deletedAt: customer.deletedAt ?? null,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        });
      }
    } catch (error) {
      throw error;
    }
  }
}
