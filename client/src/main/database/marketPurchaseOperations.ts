import { randomUUID } from "crypto";
import { db } from "./index.js";

export interface MarketPurchaseItem {
  id?: string;
  purchaseId?: string;
  productName: string;
  box: number;
  unit: number;
  totalUnit: number;
  unitPrice: number;
  tax: number;
  total: number;
  expenseTypeId?: string;
  isTaxIncluded?: boolean;
}

export interface MarketPurchase {
  id?: string;
  supplierId: string;
  ticketDate: string;
  ticketNumber: string;
  paymentType: string;
  totalAmount: number;
  items?: MarketPurchaseItem[];
}

export class MarketPurchaseDatabaseOperations {
  static async createMarketPurchase(
    purchaseData: MarketPurchase
  ): Promise<any> {
    const trx = await db.transaction();
    try {
      const now = new Date().toISOString();
      const newPurchase = {
        id: randomUUID(),
        supplierId: purchaseData.supplierId,
        ticketDate: purchaseData.ticketDate,
        ticketNumber: purchaseData.ticketNumber,
        paymentType: purchaseData.paymentType,
        totalAmount: purchaseData.totalAmount,
        createdAt: now,
        updatedAt: now,
      };

      await trx("market_purchases").insert(newPurchase);

      // Insert purchase items
      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map((item) => ({
          id: randomUUID(),
          purchaseId: newPurchase.id,
          productName: item.productName,
          box: item.box,
          unit: item.unit,
          totalUnit: item.totalUnit,
          unitPrice: item.unitPrice,
          tax: item.tax,
          total: item.total,
          expenseTypeId: item.expenseTypeId || null,
          isTaxIncluded: item.isTaxIncluded || false,
          createdAt: now,
          updatedAt: now,
        }));

        await trx("market_purchase_items").insert(itemsToInsert);
      }

      await trx.commit();
      return { ...newPurchase, items: purchaseData.items };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async updateMarketPurchase(
    purchaseId: string,
    purchaseData: MarketPurchase
  ): Promise<any> {
    const trx = await db.transaction();
    try {
      const now = new Date().toISOString();
      const updatedPurchase = {
        supplierId: purchaseData.supplierId,
        ticketDate: purchaseData.ticketDate,
        ticketNumber: purchaseData.ticketNumber,
        paymentType: purchaseData.paymentType,
        totalAmount: purchaseData.totalAmount,
        updatedAt: now,
      };

      await trx("market_purchases")
        .where("id", purchaseId)
        .update(updatedPurchase);

      // Delete existing items and insert new ones
      await trx("market_purchase_items")
        .where("purchaseId", purchaseId)
        .delete();

      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map((item) => ({
          id: randomUUID(),
          purchaseId: purchaseId,
          productName: item.productName,
          box: item.box,
          unit: item.unit,
          totalUnit: item.totalUnit,
          unitPrice: item.unitPrice,
          tax: item.tax,
          total: item.total,
          expenseTypeId: item.expenseTypeId || null,
          isTaxIncluded: item.isTaxIncluded || false,
          createdAt: now,
          updatedAt: now,
        }));

        await trx("market_purchase_items").insert(itemsToInsert);
      }

      await trx.commit();
      return { ...updatedPurchase, items: purchaseData.items };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async deleteMarketPurchase(purchaseId: string): Promise<void> {
    const trx = await db.transaction();
    try {
      await trx("market_purchase_items")
        .where("purchaseId", purchaseId)
        .delete();
      await trx("market_purchases").where("id", purchaseId).delete();
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getAllMarketPurchases(filters?: {
    supplierId?: string;
    expenseTypeId?: string;
    startDate?: string;
    endDate?: string;
    ticketNumber?: string;
  }): Promise<any[]> {
    try {
      // Base query
      let query = db("market_purchases")
        .leftJoin("suppliers", "market_purchases.supplierId", "suppliers.id")
        .select(
          "market_purchases.*",
          "suppliers.name as supplierName"
        );

      // Apply Filters
      if (filters?.supplierId) {
        query = query.where("market_purchases.supplierId", filters.supplierId);
      }

      // Filter by expenseTypeId (now located in items table)
      if (filters?.expenseTypeId) {
        query = query.whereExists(function() {
          this.select('*')
            .from('market_purchase_items')
            .whereRaw('market_purchase_items."purchaseId" = market_purchases.id')
            .andWhere('market_purchase_items.expenseTypeId', filters.expenseTypeId);
        });
      }

      if (filters?.startDate) {
        query = query.where(
          "market_purchases.ticketDate",
          ">=",
          filters.startDate
        );
      }

      if (filters?.endDate) {
        query = query.where(
          "market_purchases.ticketDate",
          "<=",
          filters.endDate
        );
      }

      if (filters?.ticketNumber) {
        query = query.where(
          "market_purchases.ticketNumber",
          "like",
          `%${filters.ticketNumber}%`
        );
      }

      const purchases = await query.orderBy(
        "market_purchases.ticketDate",
        "desc"
      );

      // Fetch items for each purchase with Expense Type info
      const purchasesWithItems = await Promise.all(
        purchases.map(async (purchase) => {
          const items = await db("market_purchase_items")
            .leftJoin("expense_types", "market_purchase_items.expenseTypeId", "expense_types.id")
            .where("purchaseId", purchase.id)
            .select(
              "market_purchase_items.*",
              "expense_types.name as expenseTypeName"
            )
            .orderBy("createdAt", "asc");
          return { ...purchase, items };
        })
      );

      return purchasesWithItems;
    } catch (error) {
      throw error;
    }
  }

  static async getMarketPurchaseById(purchaseId: string): Promise<any> {
    try {
      const purchase = await db("market_purchases")
        .leftJoin("suppliers", "market_purchases.supplierId", "suppliers.id")
        .where("market_purchases.id", purchaseId)
        .select(
          "market_purchases.*",
          "suppliers.name as supplierName"
        )
        .first();

      if (!purchase) {
        return null;
      }

      const items = await db("market_purchase_items")
        .leftJoin("expense_types", "market_purchase_items.expenseTypeId", "expense_types.id")
        .where("purchaseId", purchaseId)
        .select(
          "market_purchase_items.*",
          "expense_types.name as expenseTypeName"
        )
        .orderBy("createdAt", "asc");

      return { ...purchase, items };
    } catch (error) {
      throw error;
    }
  }
}