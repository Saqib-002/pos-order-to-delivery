import { localDb } from "./index.js";
import { FilterType, Order } from "@/types/order.js";
import { randomUUID } from "crypto";
import Logger from "electron-log";

export class OrderDatabaseOperations {
  static async saveOrder(order: Order): Promise<any> {
    const trx = await localDb.transaction();
    try {
      const now = new Date().toISOString();
      order.id = randomUUID();
      order.createdAt = now;
      if (!order.orderId) {
        const day = order.createdAt.split("T")[0];
        const dailyOrders = await trx("orders")
          .whereRaw("DATE(createdAt) = ?", [day])
          .andWhere("isDeleted", false)
          .count("* as count");
        order.orderId = (Number(dailyOrders[0]?.count) || 0) + 1;
      }
      order.updatedAt = now;
      const newOrder = {
        id: order.id,
        orderId: order.orderId,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerAddress: order.customer.address,
        status: order.status,
        deliveryPersonId: order.deliveryPersonId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.notes,
      };
      await trx("orders").insert(newOrder);
      for (const item of order.items) {
        const menuItem = await trx("menu_items")
          .where("id", item.id)
          .andWhere("isDeleted", false)
          .first();
        const orderItem = {
          id: randomUUID(),
          orderId: newOrder.id,
          menuItemId: item.id,
          quantity: item.quantity,
          customIngredients:
            menuItem.ingredients !== item.ingredients?.join(",")
              ? item.ingredients?.join(",")
              : "",
          specialInstructions: item.specialInstructions || "",
          createdAt: now,
          updatedAt: now,
        };
        await trx("order_items").insert(orderItem);
      }
      trx.commit();
      return order;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getOrders(): Promise<Order[]> {
    try {
      const rows = await localDb("orders").where("isDeleted", false);
      const orders: Order[] = rows.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        customer: {
          name: row.customerName,
          phone: row.customerPhone,
          address: row.customerAddress,
        },
        items: [],
        status: row.status,
        deliveryPersonId: row.deliveryPersonId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      for (const order of orders) {
        // Get order items
        const items = await localDb("order_items")
          .innerJoin("menu_items", "order_items.menuItemId", "menu_items.id")
          .where("order_items.orderId", order.id)
          .andWhere("order_items.isDeleted", false)
          .andWhere("menu_items.isDeleted", false);
        order.items = items.map((item) => ({
          id: item.menuItemId,
          name: item.name,
          category: item.category,
          ingredients:
            item.customIngredients === ""
              ? item.ingredients?.split(",")
              : item.customIngredients?.split(","),
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || "",
        }));

        // Get delivery person data if assigned
        if (order.deliveryPersonId) {
          const deliveryPerson = await localDb("delivery_persons")
            .where("id", order.deliveryPersonId)
            .andWhere("isDeleted", false)
            .first();

          if (deliveryPerson) {
            order.deliveryPerson = {
              id: deliveryPerson.id,
              name: deliveryPerson.name,
              phone: deliveryPerson.phone,
              vehicleType: deliveryPerson.vehicleType,
              licenseNo: deliveryPerson.licenseNo,
            };
          }
        }
      }
      return orders;
    } catch (error) {
      throw error;
    }
  }

  static async getOrderAnalytics(filter: any): Promise<any[]> {
    const { dateRange, selectedDate } = filter;
    let startDate = new Date();
    let endDate = new Date();
    switch (dateRange) {
      case "today":
        startDate = new Date(startDate.setHours(0, 0, 0, 0));
        endDate = new Date(endDate.setHours(23, 59, 59, 999));
        break;
      case "week":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid date range");
    }
    const ordersStats = await localDb("orders")
      .where("isDeleted", false)
      .andWhere("createdAt", ">=", startDate.toISOString())
      .andWhere("createdAt", "<=", endDate.toISOString())
      .select(
        localDb.raw(
          "COUNT(CASE WHEN LOWER(status) = LOWER('Delivered') THEN 1 END) as totalDelivered"
        ),
        localDb.raw(
          "COUNT(CASE WHEN LOWER(status) = LOWER('sent to kitchen') THEN 1 END) as totalSentToKitchen"
        ),
        localDb.raw(
          "COUNT(CASE WHEN LOWER(status) = LOWER('ready for delivery') THEN 1 END) as totalReadyForDelivery"
        ),
        localDb.raw(
          "COUNT(CASE WHEN LOWER(status) = LOWER('out for delivery') THEN 1 END) as totalOutForDelivery"
        ),
        localDb.raw(
          "COUNT(CASE WHEN LOWER(status) = LOWER('Cancelled') THEN 1 END) as totalCancelled"
        ),
        localDb.raw(
          `AVG(CASE WHEN LOWER(status) = LOWER('Delivered') AND assignedAt IS NOT NULL AND deliveredAt IS NOT NULL THEN (JULIANDAY(deliveredAt) - JULIANDAY(assignedAt)) * 1440 END) as avgDeliveryTime`
        )
      )
      .first();
    const hourlyData = new Array(24).fill(0);
    const orders = await localDb("orders")
      .where("isDeleted", false)
      .andWhere("createdAt", ">=", startDate.toISOString())
      .andWhere("createdAt", "<=", endDate.toISOString())
      .select(
        "id",
        "createdAt",
        "customerName",
        "orderId",
        "customerPhone",
        "status"
      );

    const newOrders = [];
    for (const order of orders) {
      const orderTime = new Date(order.createdAt);
      const hour = orderTime.getHours();
      hourlyData[hour]++;

      // Get order items for each order
      const items = await localDb("order_items")
        .innerJoin("menu_items", "order_items.menuItemId", "menu_items.id")
        .where("order_items.orderId", order.id)
        .andWhere("order_items.isDeleted", false)
        .andWhere("menu_items.isDeleted", false)
        .select(
          "menu_items.name",
          "order_items.quantity",
          "menu_items.price",
          "order_items.specialInstructions",
          "order_items.customIngredients",
          "menu_items.ingredients"
        );

      const formattedItems = items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }));

      const newOrder = {
        createdAt: order.createdAt,
        customer: {
          name: order.customerName,
          phone: order.customerPhone,
        },
        orderId: order.orderId,
        status: order.status,
        items: formattedItems,
      };
      newOrders.push(newOrder);
    }

    const topItems = await localDb("order_items")
      .innerJoin("menu_items", "order_items.menuItemId", "menu_items.id")
      .innerJoin("orders", "order_items.orderId", "orders.id")
      .where("order_items.isDeleted", false)
      .andWhere("menu_items.isDeleted", false)
      .andWhere("orders.isDeleted", false)
      .andWhere("orders.createdAt", ">=", startDate.toISOString())
      .andWhere("orders.createdAt", "<=", endDate.toISOString())
      .groupBy("menu_items.id", "menu_items.name")
      .select(
        "menu_items.name",
        localDb.raw("SUM(order_items.quantity) as count")
      )
      .orderBy("count", "desc")
      .limit(8);

    return { ...ordersStats, hourlyData, topItems, orders: newOrders };
  }
  static async getOrdersByFilter(filter: FilterType): Promise<Order[]> {
    try {
      const query = localDb("orders").where("isDeleted", false);
      if (filter.searchTerm.trim()) {
        query
          .andWhere("customerName", "like", `%${filter.searchTerm}%`)
          .orWhere("customerPhone", "like", `%${filter.searchTerm}%`)
          .orWhere("orderId", "like", `%${filter.searchTerm}%`);
      }
      if (filter.selectedDate) {
        const selectedDate = new Date(filter.selectedDate)
          .toISOString()
          .split("T")[0];
        query.whereRaw("DATE(createdAt) = ?", [selectedDate]);
      }
      if (
        filter.selectedStatus[0] !== "all" &&
        filter.selectedStatus.length > 0
      ) {
        query.whereRaw(
          "LOWER(status) IN (" +
            filter.selectedStatus.map(() => "?").join(",") +
            ")",
          filter.selectedStatus.map((s) => s.toLowerCase())
        );
      }
      const rows = await query;
      const orders: Order[] = rows.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        customer: {
          name: row.customerName,
          phone: row.customerPhone,
          address: row.customerAddress,
        },
        items: [],
        status: row.status,
        deliveryPersonId: row.deliveryPersonId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      for (const order of orders) {
        // Get order items
        const items = await localDb("order_items")
          .innerJoin("menu_items", "order_items.menuItemId", "menu_items.id")
          .where("order_items.orderId", order.id)
          .andWhere("order_items.isDeleted", false)
          .andWhere("menu_items.isDeleted", false);
        order.items = items.map((item) => ({
          id: item.menuItemId,
          name: item.name,
          category: item.category,
          ingredients:
            item.customIngredients === ""
              ? item.ingredients?.split(",")
              : item.customIngredients?.split(","),
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || "",
        }));

        // Get delivery person data if assigned
        if (order.deliveryPersonId) {
          const deliveryPerson = await localDb("delivery_persons")
            .where("id", order.deliveryPersonId)
            .andWhere("isDeleted", false)
            .first();

          if (deliveryPerson) {
            order.deliveryPerson = {
              id: deliveryPerson.id,
              name: deliveryPerson.name,
              phone: deliveryPerson.phone,
              vehicleType: deliveryPerson.vehicleType,
              licenseNo: deliveryPerson.licenseNo,
            };
          }
        }
      }
      return orders;
    } catch (error) {
      throw error;
    }
  }

  static async updateOrder(order: Order): Promise<any> {
    const trx = await localDb.transaction();
    try {
      const now = new Date().toISOString();

      await trx("orders").where("id", order.id).update({
        orderId: order.orderId,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerAddress: order.customer.address,
        status: order.status,
        deliveryPersonId: order.deliveryPersonId,
        updatedAt: now,
      });
      const existingItems = await trx("order_items")
        .where("orderId", order.id)
        .andWhere("isDeleted", false);
      const existingItemsMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.menuItemId}-${item.customIngredients || ""}`;
        existingItemsMap.set(key, item);
      });
      const processedKeys = new Set();
      for (const item of order.items) {
        const menuItem = await trx("menu_items")
          .where("id", item.id)
          .andWhere("isDeleted", false)
          .first();
        if (!menuItem) {
          Logger.error("Menu item not found:", item.id);
          continue;
        }
        const key = `${item.id}-${item.ingredients?.join(",") || ""}`;
        const existingItem = existingItemsMap.get(key);
        if (existingItem) {
          await trx("order_items")
            .where("id", existingItem.id)
            .update({
              quantity: item.quantity,
              specialInstructions: item.specialInstructions || "",
              updatedAt: now,
            });
          processedKeys.add(key);
        } else {
          const orderItem = {
            id: randomUUID(),
            orderId: order.id,
            menuItemId: item.id,
            quantity: item.quantity,
            customIngredients: item.ingredients?.join(","),
            createdAt: now,
            updatedAt: now,
          };
          await trx("order_items").insert(orderItem);
        }
      }
      for (const [key, existingItem] of existingItemsMap) {
        if (!processedKeys.has(key)) {
          await trx("order_items").where("id", existingItem.id).update({
            isDeleted: true,
            updatedAt: now,
          });
        }
      }
      await trx.commit();
      return order;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async deleteOrder(id: string): Promise<any> {
    const trx = await localDb.transaction();
    try {
      const now = new Date().toISOString();
      await trx("orders").where("id", id).update({
        isDeleted: true,
        updatedAt: now,
      });
      await trx("order_items").where("orderId", id).update({
        isDeleted: true,
        updatedAt: now,
      });
      trx.commit();
      return { id };
    } catch (error) {
      trx.rollback();
      throw error;
    }
  }
  static async cancelOrder(id: string): Promise<any> {
    try {
      const now = new Date().toISOString();
      await localDb("orders").where("id", id).update({
        updatedAt: now,
        cancelledAt: now,
        status: "cancelled",
      });
      return { id };
    } catch (error) {
      throw error;
    }
  }
  static async readyOrder(id: string): Promise<any> {
    try {
      const now = new Date().toISOString();
      await localDb("orders").where("id", id).update({
        updatedAt: now,
        readyAt: now,
        status: "ready for delivery",
      });
      return { id };
    } catch (error) {
      throw error;
    }
  }
  static async markDeliveredOrder(id: string): Promise<any> {
    try {
      const now = new Date().toISOString();
      await localDb("orders").where("id", id).update({
        updatedAt: now,
        deliveredAt: now,
        status: "delivered",
      });
      return { id };
    } catch (error) {
      throw error;
    }
  }
}
