import { calculateOrderTotal } from "../../renderer/utils/orderCalculations.js";
import { db } from "./index.js";
import { FilterType, Order, OrderItem } from "@/types/order.js";
import { randomUUID } from "crypto";
import { calculatePaymentStatus } from "../../renderer/utils/paymentStatus.js";

const stringToComplements = (complementStr: any): any[] => {
  if (Array.isArray(complementStr)) {
    return complementStr;
  }
  if (typeof complementStr !== "string" || !complementStr) {
    return [];
  }

  const complements = complementStr.split("=");
  return complements.map((c) => {
    const [groupId, groupName, itemId, itemName, price] = c.split("|");
    return {
      groupId,
      groupName,
      itemId,
      itemName,
      price: parseFloat(price || "0"),
      priority: 0,
    };
  });
};

export class OrderDatabaseOperations {
  static async saveOrder(item: any): Promise<any> {
    const trx = await db.transaction();
    try {
      const nowObj = new Date();
      const nowISO = nowObj.toISOString();
      const startOfDay = new Date(nowObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(nowObj);
      endOfDay.setHours(23, 59, 59, 999);
      const countResult = await trx("orders")
        .whereBetween("createdAt", [
          startOfDay.toISOString(),
          endOfDay.toISOString(),
        ])
        .count("* as count")
        .first();
      const newDailyOrderId = (Number((countResult as any).count) || 0) + 1;
      const newOrder = {
        id: randomUUID(),
        status: "pending",
        orderId: newDailyOrderId,
        createdAt: nowObj,
        updatedAt: nowObj,
      };
      const order = await trx("orders").insert(newOrder).returning("*");
      const orderItem = {
        ...item,
        printers: item.printers.join("="),
        id: randomUUID(),
        orderId: newOrder.id,
        createdAt: nowObj,
        updatedAt: nowObj,
      };
      await trx("order_items").insert(orderItem);
      await trx.commit();
      return {
        order: order[0],
        itemId: orderItem.id,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  static async addItemToOrder(orderId: string, item: any): Promise<any> {
    try {
      const now = new Date().toISOString();
      const orderItem = {
        ...item,
        id: randomUUID(),
        printers: item.printers.join("="),
        orderId,
        createdAt: now,
        updatedAt: now,
        isKitchenPrinted: false,
      };
      await db("order_items").insert(orderItem);
      return { itemId: orderItem.id };
    } catch (error) {
      throw error;
    }
  }
  static async removeItemFromOrder(
    orderId: string,
    itemId: string
  ): Promise<any> {
    try {
      await db("order_items").where("id", itemId).delete();
      const totalOrderItems = await db("order_items")
        .where("orderId", orderId)
        .count("* as count");
      if (Number(totalOrderItems[0]?.count) === 0) {
        const now = new Date().toISOString();
        await db("orders").where("id", orderId).update({
          status: "cancelled",
          cancelAt: now,
          updatedAt: now,
        });
      }
      return { itemId };
    } catch (error) {
      throw error;
    }
  }
  static async removeMenuFromOrder(
    orderId: string,
    menuId: string,
    menuSecondaryId: string
  ): Promise<any> {
    try {
      await db("order_items")
        .where("orderId", orderId)
        .andWhere("menuId", menuId)
        .andWhere("menuSecondaryId", menuSecondaryId)
        .delete();
      const totalOrderItems = await db("order_items")
        .where("orderId", orderId)
        .count("* as count");
      if (Number(totalOrderItems[0]?.count) === 0) {
        const now = new Date().toISOString();
        await db("orders").where("id", orderId).update({
          status: "cancelled",
          cancelAt: now,
          updatedAt: now,
        });
      }
      return { menuId };
    } catch (error) {
      throw error;
    }
  }
  static async removeMenuItemFromOrder(
    orderId: string,
    menuId: string,
    menuSecondaryId: string,
    productId: string,
    menuPageId: string
  ): Promise<any> {
    try {
      await db("order_items")
        .where("orderId", orderId)
        .andWhere("menuId", menuId)
        .andWhere("menuSecondaryId", menuSecondaryId)
        .andWhere("productId", productId)
        .andWhere("menuPageId", menuPageId)
        .delete();
      const totalOrderItems = await db("order_items")
        .where("orderId", orderId)
        .count("* as count");
      if (Number(totalOrderItems[0]?.count) === 0) {
        const now = new Date().toISOString();
        await db("orders").where("id", orderId).update({
          status: "cancelled",
          cancelAt: now,
          updatedAt: now,
        });
      }
      return { menuId };
    } catch (error) {
      throw error;
    }
  }
  static updateMenuQuantity(
    orderId: string,
    menuId: string,
    menuSecondaryId: string,
    quantity: number
  ): Promise<any> {
    try {
      const now = new Date().toISOString();
      return db("order_items")
        .where("orderId", orderId)
        .andWhere("menuId", menuId)
        .andWhere("menuSecondaryId", menuSecondaryId)
        .update({ quantity, isKitchenPrinted: false, updatedAt: now });
    } catch (error) {
      throw error;
    }
  }
  static async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<any> {
    try {
      const now = new Date().toISOString();
      await db("order_items").where("id", itemId).update({
        quantity,
        isKitchenPrinted: false,
        updatedAt: now,
      });
      return { itemId };
    } catch (error) {
      throw error;
    }
  }
  static async updateOrderItem(
    itemId: string,
    itemData: Partial<OrderItem>
  ): Promise<any> {
    try {
      const now = new Date().toISOString();
      await db("order_items")
        .where("id", itemId)
        .update({
          ...itemData,
          isKitchenPrinted: false,
          updatedAt: now,
        });
      return { itemId };
    } catch (error) {
      throw error;
    }
  }
  static async updateOrderItems(
    items: { itemId: string; itemData: Partial<OrderItem> }[]
  ): Promise<any> {
    const trx = await db.transaction();
    try {
      const now = new Date().toISOString();
      for (const { itemId, itemData } of items) {
        await trx("order_items")
          .where("id", itemId)
          .update({
            ...itemData,
            updatedAt: now,
          });
      }
      await trx.commit();
      return { items };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  static async deleteOrder(id: string, cancelNote?: string): Promise<any> {
    try {
      const now = new Date().toISOString();
      const existingOrder = await db("orders").where("id", id).first();
      const existingNotes = existingOrder?.notes || "";
      const cancelNoteText = cancelNote
        ? `[CANCELLED: ${now}] ${cancelNote}${existingNotes ? `\n\n${existingNotes}` : ""}`
        : existingNotes;

      await db("orders").where("id", id).update({
        status: "cancelled",
        cancelAt: now,
        notes: cancelNoteText,
        updatedAt: now,
      });
      return { id };
    } catch (error) {
      throw error;
    }
  }
  static async getOrderItems(orderId: string): Promise<any[]> {
    try {
      const items = await db("order_items").where("orderId", orderId);
      return items.map((item) => ({
        ...item,
        printers: item.printers.split("="),
      }));
    } catch (error) {
      throw error;
    }
  }
  static async updateOrder(
    orderId: string,
    orderData: Partial<Order>
  ): Promise<any> {
    try {
      const now = new Date().toISOString();
      await db("orders")
        .where("id", orderId)
        .update({
          ...orderData,
          updatedAt: now,
        });
      return { orderId };
    } catch (error) {
      throw error;
    }
  }
  static async getOrderAnalytics(filter: any): Promise<any> {
    const {
      dateRange,
      selectedDate,
      startDateRange,
      endDateRange,
      orderType,
      page = 0,
      limit = 10,
    } = filter;
    let startDate = new Date();
    let endDate = new Date();

    if (startDateRange && endDateRange) {
      startDate = new Date(startDateRange);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateRange);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      switch (dateRange) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          if (selectedDate) {
            startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        default:
          throw new Error("Invalid date range");
      }
    }

    const applyOrderTypeFilter = (query: any) => {
      if (orderType) {
        // Normalize orderType: handle both "dine-in" and "dinein"
        const normalizedOrderType = orderType.toLowerCase().replace(/-/g, "");
        return query.whereRaw(
          "LOWER(REPLACE(\"orderType\", '-', '')) = LOWER(?)",
          [normalizedOrderType]
        );
      }
      return query;
    };

    const ordersStatsResult = await applyOrderTypeFilter(
      db("orders").whereBetween("createdAt", [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
    )
      .select(
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('Delivered') THEN 1 END) as "totalDelivered"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('sent to kitchen') THEN 1 END) as "totalSentToKitchen"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('ready for delivery') THEN 1 END) as "totalReadyForDelivery"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('out for delivery') THEN 1 END) as "totalOutForDelivery"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('Cancelled') THEN 1 END) as "totalCancelled"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('Completed') THEN 1 END) as "totalCompleted"`
        ),
        db.raw(
          `COUNT(CASE WHEN LOWER("status") = LOWER('Pending') THEN 1 END) as "totalPending"`
        ),
        db.raw(
          `AVG(CASE WHEN LOWER("status") = LOWER('Delivered') AND "assignedAt" IS NOT NULL AND "deliveredAt" IS NOT NULL THEN EXTRACT(EPOCH FROM ("deliveredAt" - "assignedAt")) / 60 END) as "avgDeliveryTime"`
        )
      )
      .first();

    const ordersStats = ordersStatsResult || {};
    // Handle BigInt and string values from COUNT queries
    ordersStats.totalDelivered =
      typeof ordersStats.totalDelivered === "bigint"
        ? Number(ordersStats.totalDelivered)
        : parseInt(String(ordersStats.totalDelivered || 0), 10);
    ordersStats.totalSentToKitchen =
      typeof ordersStats.totalSentToKitchen === "bigint"
        ? Number(ordersStats.totalSentToKitchen)
        : parseInt(String(ordersStats.totalSentToKitchen || 0), 10);
    ordersStats.totalReadyForDelivery =
      typeof ordersStats.totalReadyForDelivery === "bigint"
        ? Number(ordersStats.totalReadyForDelivery)
        : parseInt(String(ordersStats.totalReadyForDelivery || 0), 10);
    ordersStats.totalOutForDelivery =
      typeof ordersStats.totalOutForDelivery === "bigint"
        ? Number(ordersStats.totalOutForDelivery)
        : parseInt(String(ordersStats.totalOutForDelivery || 0), 10);
    ordersStats.totalCancelled =
      typeof ordersStats.totalCancelled === "bigint"
        ? Number(ordersStats.totalCancelled)
        : parseInt(String(ordersStats.totalCancelled || 0), 10);
    ordersStats.totalPending =
      typeof ordersStats.totalPending === "bigint"
        ? Number(ordersStats.totalPending)
        : parseInt(String(ordersStats.totalPending || 0), 10);
    ordersStats.totalCompleted =
      typeof ordersStats.totalCompleted === "bigint"
        ? Number(ordersStats.totalCompleted)
        : parseInt(String(ordersStats.totalCompleted || 0), 10);
    ordersStats.avgDeliveryTime =
      typeof ordersStats.avgDeliveryTime === "bigint"
        ? Number(ordersStats.avgDeliveryTime)
        : parseFloat(String(ordersStats.avgDeliveryTime || 0));
    const baseOrdersQuery = applyOrderTypeFilter(
      db("orders").whereBetween("createdAt", [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
    );
    const allOrdersForHourly = await baseOrdersQuery
      .clone()
      .select("createdAt");
    const hourlyData = new Array(24).fill(0);
    allOrdersForHourly.forEach((order: any) => {
      const orderTime = new Date(order.createdAt);
      const hour = orderTime.getHours();
      hourlyData[hour]++;
    });
    const totalCountResult = await baseOrdersQuery
      .clone()
      .count("* as count")
      .first();
    const ordersTotalCount = parseInt((totalCountResult as any).count, 10) || 0;
    const orders = await baseOrdersQuery
      .clone()
      .select(
        "id",
        "createdAt",
        "customerName",
        "orderId",
        "customerPhone",
        "status"
      )
      .offset(page * limit)
      .limit(limit)
      .orderBy("createdAt", "desc");

    const newOrders = [];
    for (const order of orders) {
      const items = await db("order_items")
        .where("orderId", order.id)
        .select("productName as name", "quantity");
      const formattedItems = items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }));

      const newOrder = {
        createdAt:
          order.createdAt instanceof Date
            ? order.createdAt.toISOString()
            : order.createdAt,
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

    let topItemsQuery = db("order_items")
      .innerJoin("orders", "order_items.orderId", "orders.id")
      .whereBetween("orders.createdAt", [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
      .andWhere("order_items.menuId", null)
      .andWhereNot("orders.status", "pending");

    if (orderType) {
      const normalizedOrderType = orderType.toLowerCase().replace(/-/g, "");
      topItemsQuery = topItemsQuery.whereRaw(
        "LOWER(REPLACE(orders.\"orderType\", '-', '')) = LOWER(?)",
        [normalizedOrderType]
      );
    }

    const topItemsRaw = await topItemsQuery
      .groupBy("order_items.productId", "order_items.productName")
      .select(
        "order_items.productName as name",
        db.raw("SUM(order_items.quantity) as count")
      )
      .orderBy("count", "desc")
      .limit(8);

    const topItems = topItemsRaw.map((item: any) => ({
      name: item.name,
      count:
        typeof item.count === "bigint"
          ? Number(item.count)
          : parseInt(item.count, 10) || 0,
    }));
    const subquery = db("order_items")
      .select(
        "menuId",
        "menuName",
        "orderId",
        db.raw("MIN(quantity) as menu_qty")
      )
      .whereNotNull("menuId")
      .groupBy("menuId", "menuName", "orderId")
      .as("sub");

    let topMenusQuery = db(subquery)
      .innerJoin("orders", "sub.orderId", "orders.id")
      .whereBetween("orders.createdAt", [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
      .andWhereNot("orders.status", "pending");

    if (orderType) {
      const normalizedOrderType = orderType.toLowerCase().replace(/-/g, "");
      topMenusQuery = topMenusQuery.whereRaw(
        "LOWER(REPLACE(orders.\"orderType\", '-', '')) = LOWER(?)",
        [normalizedOrderType]
      );
    }

    const topMenusRaw = await topMenusQuery
      .select("sub.menuName as name", db.sum("sub.menu_qty").as("count"))
      .groupBy("sub.menuId", "sub.menuName")
      .orderBy("count", "desc")
      .limit(8);

    const topMenus = topMenusRaw.map((menu: any) => ({
      name: menu.name,
      count:
        typeof menu.count === "bigint"
          ? Number(menu.count)
          : parseInt(menu.count, 10) || 0,
    }));

    let ordersQuery = db("orders")
      .whereBetween("createdAt", [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
      .andWhereNot("status", "pending")
      .whereNotNull("orderType")
      .whereNot("orderType", "");

    if (orderType) {
      const normalizedOrderType = orderType.toLowerCase().replace(/-/g, "");
      ordersQuery = ordersQuery.whereRaw(
        "LOWER(REPLACE(\"orderType\", '-', '')) = LOWER(?)",
        [normalizedOrderType]
      );
    }

    const ordersForTotals = await ordersQuery.select("id", "orderType","status");

    const orderIds = ordersForTotals.map((o: any) => o.id);
    const allOrderItems =
      orderIds.length > 0
        ? await db("order_items").whereIn("orderId", orderIds)
        : [];

    const orderTotalsMap = new Map<string, { type: string; total: number }>();

    for (const order of ordersForTotals) {
      const orderItems = allOrderItems.filter(
        (item: any) => item.orderId === order.id
      );

      const formattedItems: OrderItem[] = orderItems.map((item: any) => {
        let complements: any[] = [];
        if (item.complements) {
          try {
            if (
              typeof item.complements === "string" &&
              item.complements.trim().startsWith("[")
            ) {
              complements = JSON.parse(item.complements);
            } else {
              complements = stringToComplements(item.complements);
            }
          } catch (e) { 
            complements = stringToComplements(item.complements);
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: parseFloat(item.productPrice || 0),
          productDescription: item.productDescription,
          productPriority: parseInt(item.productPriority || 0),
          productDiscount: parseFloat(item.productDiscount || 0),
          productTax: parseFloat(item.productTax || 0),
          variantId: item.variantId || "",
          variantName: item.variantName || "",
          variantPrice: parseFloat(item.variantPrice || 0),
          complements: complements,
          quantity: parseInt(item.quantity || 1),
          totalPrice: parseFloat(item.totalPrice || 0),
          menuId: item.menuId || undefined,
          menuSecondaryId: item.menuSecondaryId || undefined,
          menuName: item.menuName || undefined,
          menuPrice: item.menuPrice ? parseFloat(item.menuPrice) : undefined,
          menuTax: item.menuTax ? parseFloat(item.menuTax) : undefined,
          menuDiscount: item.menuDiscount
            ? parseFloat(item.menuDiscount)
            : undefined,
          supplement: item.supplement ? parseFloat(item.supplement) : undefined,
        };
      });

      const { orderTotal } = calculateOrderTotal(formattedItems);
      if(order.status !== 'cancelled'){
        const orderTypeKey = order.orderType;
        if (!orderTotalsMap.has(orderTypeKey)) {
          orderTotalsMap.set(orderTypeKey, { type: orderTypeKey, total: 0 });
        }
        const current = orderTotalsMap.get(orderTypeKey)!;
        current.total += orderTotal;
      }
    }

    const orderTypeTotals = Array.from(orderTotalsMap.values())
      .map((item) => ({
        type: item.type,
        total: parseFloat(item.total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);

    const serializedOrdersStats = {
      totalDelivered: Number(ordersStats.totalDelivered) || 0,
      totalSentToKitchen: Number(ordersStats.totalSentToKitchen) || 0,
      totalReadyForDelivery: Number(ordersStats.totalReadyForDelivery) || 0,
      totalOutForDelivery: Number(ordersStats.totalOutForDelivery) || 0,
      totalCancelled: Number(ordersStats.totalCancelled) || 0,
      totalCompleted: Number(ordersStats.totalCompleted) || 0,
      totalPending: Number(ordersStats.totalPending) || 0,
      avgDeliveryTime: Number(ordersStats.avgDeliveryTime) || 0,
    };

    return {
      ...serializedOrdersStats,
      hourlyData: hourlyData.map((val: any) => Number(val) || 0),
      topItems,
      topMenus,
      orderTypeTotals,
      orders: newOrders,
      ordersTotalCount: Number(ordersTotalCount) || 0,
    };
  }
  static async duplicateMenuInOrder(
    orderId: string,
    menuId: string,
    menuSecondaryId: string
  ): Promise<{ menuId: string; newSecondaryId: number }> {
    const trx = await db.transaction();
    try {
      const itemsToDuplicate = await trx("order_items")
        .where("orderId", orderId)
        .andWhere("menuId", menuId)
        .andWhere("menuSecondaryId", menuSecondaryId);

      if (itemsToDuplicate.length === 0) {
        throw new Error("No items found in the specified menu group");
      }

      const maxSecondaryId = await trx("order_items")
        .where("orderId", orderId)
        .andWhere("menuId", menuId)
        .max("menuSecondaryId as maxId")
        .first();

      const newSecondaryId = (maxSecondaryId?.maxId || 0) + 1;
      const now = new Date().toISOString();

      for (const item of itemsToDuplicate) {
        const { id, ...itemData } = item;
        await trx("order_items").insert({
          ...itemData,
          id: randomUUID(),
          menuSecondaryId: newSecondaryId,
          createdAt: now,
          updatedAt: now,
        });
      }

      await trx.commit();
      return { menuId, newSecondaryId };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getOrdersByFilter(
    filter: FilterType
  ): Promise<{ orders: Order[]; totalCount: number }> {
    try {
      const { page = 0, limit = 10 } = filter;
      const offset = page * limit;
      const query = db("orders");
      if (filter.searchTerm) {
        query.where(function () {
          this.where("customerName", "like", `%${filter.searchTerm}%`)
            .orWhere("customerPhone", "like", `%${filter.searchTerm}%`)
            .orWhere("orderId", filter.searchTerm);
        });
      }
      const parseLocalStart = (dateInput: Date | string): Date => {
        if (typeof dateInput === "string") {
          const datePart = dateInput.split("T")[0];
          const parts = datePart.split("-");
          return new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
          );
        } else if (dateInput instanceof Date) {
          const d = new Date(dateInput);
          d.setHours(0, 0, 0, 0);
          return d;
        }
        return new Date();
      };
      if (filter.startDateRange && filter.endDateRange) {
        const startDate = new Date(filter.startDateRange);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filter.endDateRange);
        endDate.setHours(23, 59, 59, 999);
        query.whereBetween("createdAt", [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
      } else if (filter.selectedDate) {
        const startDate = parseLocalStart(filter.selectedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        query.whereBetween("createdAt", [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
      }
      if (
        filter.selectedStatus.length > 0 &&
        filter.selectedStatus[0] !== "all"
      ) {
        query.whereIn("status", filter.selectedStatus);
      }
      if (filter.selectedDeliveryPerson) {
        query.where("deliveryPersonId", filter.selectedDeliveryPerson);
      }
      if (filter.selectedCustomer) {
        const customer = await db("customers")
          .where("id", filter.selectedCustomer)
          .first();
        if (customer) {
          query.where("customerPhone", customer.phone);
        }
      }
      const baseQuery = query.clone();

      if (
        filter.selectedPaymentStatus.length > 0 &&
        filter.selectedPaymentStatus[0] !== "all"
      ) {
        const paymentStatusesArray = filter.selectedPaymentStatus
          .map((s) => `'${s}'`)
          .join(",");
        const amountPattern = "^[0-9]+(\\.[0-9]*)?$";
        const sql = `
                CASE
                    WHEN (
                        CASE
                            WHEN "paymentType" IS NULL OR "paymentType" = ''
                            THEN 0
                            ELSE COALESCE(
                                (SELECT SUM(CAST(TRIM(split_part(elem, ':', 2)) AS NUMERIC))
                                 FROM unnest(string_to_array("paymentType", ',')) AS elem
                                 WHERE TRIM(split_part(elem, ':', 2)) ~ ?),
                                0
                            )
                        END
                    ) <= 0 THEN 'UNPAID'
                    WHEN ABS(
                        (
                            COALESCE(
                                (SELECT SUM(
                                    (COALESCE("oi"."productPrice", 0) + 
                                     COALESCE("oi"."productTax", 0) - 
                                     COALESCE("oi"."productDiscount", 0) + 
                                     COALESCE("oi"."variantPrice", 0) +
                                     COALESCE(
                                         CASE 
                                           WHEN "oi"."complements" IS NOT NULL AND "oi"."complements" LIKE '[%' THEN
                                             (SELECT COALESCE(SUM(CAST((elem->>'price') AS NUMERIC)), 0)
                                              FROM jsonb_array_elements("oi"."complements"::jsonb) AS elem)
                                           ELSE 0 
                                         END,
                                         0
                                     )
                                    ) * COALESCE("oi"."quantity", 0)
                                ) FROM "order_items" "oi"
                                WHERE "oi"."orderId" = "orders"."id" AND "oi"."menuId" IS NULL
                                ), 0
                            ) +
                            COALESCE(
                                (SELECT SUM( (g.base_price + g.tax_per_unit + g.supplement_total) * g.qty )
                                 FROM (
                                     SELECT 
                                         MIN(COALESCE("oi2"."menuPrice", 0)) AS base_price,
                                         MIN(COALESCE("oi2"."menuTax", 0)) AS tax_per_unit,
                                         SUM(COALESCE("oi2"."supplement", 0)) AS supplement_total,
                                         MIN(COALESCE("oi2"."quantity", 0)) AS qty
                                     FROM "order_items" "oi2"
                                     WHERE "oi2"."orderId" = "orders"."id" AND "oi2"."menuId" IS NOT NULL
                                     GROUP BY "oi2"."menuId", COALESCE("oi2"."menuSecondaryId", 0)
                                 ) g
                                ), 0
                            )
                        ) -
                        (
                            CASE
                                WHEN "paymentType" IS NULL OR "paymentType" = ''
                                THEN 0
                                ELSE COALESCE(
                                    (SELECT SUM(CAST(TRIM(split_part(elem, ':', 2)) AS NUMERIC))
                                     FROM unnest(string_to_array("paymentType", ',')) AS elem
                                     WHERE TRIM(split_part(elem, ':', 2)) ~ ?),
                                    0
                                )
                            END
                        )
                    ) <= 0.01 THEN 'PAID'
                    ELSE 'PARTIAL'
                END = ANY(ARRAY[${paymentStatusesArray}])
            `;
        baseQuery.whereRaw(sql, [amountPattern, amountPattern]);
      }

      const countQuery = baseQuery.clone().count("* as count").first();
      const dataQuery = baseQuery
        .clone()
        .limit(limit)
        .offset(offset)
        .orderBy("createdAt", "desc");
      const [countResult, orders] = await Promise.all([countQuery, dataQuery]);
      const totalCount = parseInt((countResult as any).count, 10) || 0;
      const newOrders = [];
      for (const order of orders) {
        const items = await db("order_items").where("orderId", order.id);
        const totalAmount = calculateOrderTotal(items).orderTotal;
        const paymentStatusResult = calculatePaymentStatus(
          order.paymentType,
          totalAmount
        );
        const newOrder = {
          customer: {
            name: order.customerName,
            phone: order.customerPhone,
            address: order.customerAddress,
            cif: order.customerCIF,
            email: order.customerEmail,
            comments: order.customerComments,
          },
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          assignedAt: order.assignedAt,
          deliveredAt: order.deliveredAt,
          pickupTime: order.pickupTime,
          orderId: order.orderId,
          status: order.status,
          paymentType: order.paymentType,
          orderType: order.orderType,
          notes: order.notes,
          isPaid: order.isPaid,
          id: order.id,
          deliveryPerson: {
            id: order.deliveryPersonId,
            name: order.deliveryPersonName,
            phone: order.deliveryPersonPhone,
            email: order.deliveryPersonEmail,
            vehicleType: order.deliveryPersonVehicleType,
            licenseNo: order.deliveryPersonLicenseNo,
          },
          paymentStatus: paymentStatusResult.status,
          items: items.map((item) => ({
            ...item,
            printers: item.printers.split("="),
          })),
        };
        newOrders.push(newOrder);
      }
      return { orders: newOrders, totalCount };
    } catch (error) {
      throw error;
    }
  }
}
