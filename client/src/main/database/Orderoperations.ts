import { calculateOrderTotal } from "../../renderer/utils/orderCalculations.js";
import { db } from "./index.js";
import { FilterType, Order, OrderItem } from "@/types/order.js";
import { randomUUID } from "crypto";
import { calculatePaymentStatus } from "../../renderer/utils/paymentStatus.js";

export class OrderDatabaseOperations {
    static async saveOrder(item: any): Promise<any> {
        const trx = await db.transaction();
        try {
            const now = new Date().toISOString();
            const targetTimezone = 'Europe/Madrid';
            const todayDate = new Date().toLocaleDateString('sv-SE', {
              timeZone: targetTimezone,
            });
            const countResult = await trx("orders")
                    .whereRaw(`DATE("createdAt" AT TIME ZONE ?) = ?`, [targetTimezone, todayDate])
                .count("* as count")
                .first();
            const newDailyOrderId =
                (Number((countResult as any).count) || 0) + 1;
            const newOrder = {
                id: randomUUID(),
                status: "pending",
                orderId: newDailyOrderId,
                createdAt: now,
                updatedAt: now,
            };
            const order = await trx("orders").insert(newOrder).returning("*");
            const orderItem = {
                ...item,
                printers: item.printers.join("="),
                id: randomUUID(),
                orderId: newOrder.id,
                createdAt: now,
                updatedAt: now,
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
            return db("order_items")
                .where("orderId", orderId)
                .andWhere("menuId", menuId)
                .andWhere("menuSecondaryId", menuSecondaryId)
                .update({ quantity });
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
                    updatedAt: now,
                });
            return { itemId };
        } catch (error) {
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
            // Fall back to dateRange string logic
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
                    startDate = new Date(
                        endDate.getTime() - 7 * 24 * 60 * 60 * 1000
                    );
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case "month":
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    startDate = new Date(
                        endDate.getTime() - 30 * 24 * 60 * 60 * 1000
                    );
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
        const ordersStats = await db("orders")
            .whereBetween("createdAt", [
                startDate.toISOString(),
                endDate.toISOString(),
            ])
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
        ordersStats.totalDelivered =
            parseInt(ordersStats.totalDelivered, 10) || 0;
        ordersStats.totalSentToKitchen =
            parseInt(ordersStats.totalSentToKitchen, 10) || 0;
        ordersStats.totalReadyForDelivery =
            parseInt(ordersStats.totalReadyForDelivery, 10) || 0;
        ordersStats.totalOutForDelivery =
            parseInt(ordersStats.totalOutForDelivery, 10) || 0;
        ordersStats.totalCancelled =
            parseInt(ordersStats.totalCancelled, 10) || 0;
        ordersStats.totalPending = parseInt(ordersStats.totalPending, 10) || 0;
        ordersStats.totalCompleted =
            parseInt(ordersStats.totalCompleted, 10) || 0;
        ordersStats.avgDeliveryTime =
            parseFloat(ordersStats.avgDeliveryTime) || 0;
        const baseOrdersQuery = db("orders").whereBetween("createdAt", [
            startDate.toISOString(),
            endDate.toISOString(),
        ]);
        const allOrdersForHourly = await baseOrdersQuery
            .clone()
            .select("createdAt");
        const hourlyData = new Array(24).fill(0);
        allOrdersForHourly.forEach((order) => {
            const orderTime = new Date(order.createdAt);
            const hour = orderTime.getHours();
            hourlyData[hour]++;
        });
        const totalCountResult = await baseOrdersQuery
            .clone()
            .count("* as count")
            .first();
        const ordersTotalCount =
            parseInt((totalCountResult as any).count, 10) || 0;
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
            // Get order items for each order
            const items = await db("order_items")
                .where("orderId", order.id)
                .select("productName as name", "quantity");
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

        const topItems = await db("order_items")
            .innerJoin("orders", "order_items.orderId", "orders.id")
            .whereBetween("orders.createdAt", [
                startDate.toISOString(),
                endDate.toISOString(),
            ])
            .andWhere("order_items.menuId", null)
            .andWhereNot("orders.status", "pending")
            .groupBy("order_items.productId", "order_items.productName")
            .select(
                "order_items.productName as name",
                db.raw("SUM(order_items.quantity) as count")
            )
            .orderBy("count", "desc")
            .limit(8);
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

        const topMenus = await db(subquery)
            .innerJoin("orders", "sub.orderId", "orders.id")
            .whereBetween("orders.createdAt", [
                startDate.toISOString(),
                endDate.toISOString(),
            ])
            .andWhereNot("orders.status", "pending")
            .select("sub.menuName as name", db.sum("sub.menu_qty").as("count"))
            .groupBy("sub.menuId", "sub.menuName")
            .orderBy("count", "desc")
            .limit(8);

        return {
            ...ordersStats,
            hourlyData,
            topItems,
            topMenus,
            orders: newOrders,
            ordersTotalCount,
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
                        .orWhere(
                            "customerPhone",
                            "like",
                            `%${filter.searchTerm}%`
                        )
                        .orWhere("orderId", filter.searchTerm);
                });
            }
            if (filter.startDateRange && filter.endDateRange) {
                const startDate = new Date(filter.startDateRange);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(filter.endDateRange);
                endDate.setHours(23, 59, 59, 999);
                query
                    .andWhere("createdAt", ">=", startDate.toISOString())
                    .andWhere("createdAt", "<=", endDate.toISOString());
            } else if (filter.selectedDate) {
                const startDate = new Date(filter.selectedDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(filter.selectedDate);
                endDate.setHours(23, 59, 59, 999);
                query
                    .andWhere("createdAt", ">=", startDate.toISOString())
                    .andWhere("createdAt", "<=", endDate.toISOString());
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
            const [countResult, orders] = await Promise.all([
                countQuery,
                dataQuery,
            ]);
            const totalCount = parseInt((countResult as any).count, 10) || 0;
            const newOrders = [];
            for (const order of orders) {
                const items = await db("order_items").where(
                    "orderId",
                    order.id
                );
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
