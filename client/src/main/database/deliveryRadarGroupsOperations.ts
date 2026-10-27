import { db } from "./index.js";
import { randomUUID } from "crypto";

export interface DeliveryRadarGroup {
  id: string;
  name: string;
  color: string;
  orderIds: string[];
  createdAt: string;
}

// Placeholder for the number in a default group name template ("Grupo __NUM__")
export const GROUP_NUMBER_TOKEN = "__NUM__";

// Only orders still waiting for a driver can stay in a group
const GROUPABLE_ORDER_STATUSES = ["ready for delivery", "sent to kitchen"];

export class DeliveryRadarGroupsOperations {
  // Drops order links whose order was dispatched, delivered, cancelled or
  // deleted — from any screen or POS — so groups never keep stale orders.
  // Orders that are only outside the current date filter stay grouped.
  static async removeStaleOrders(): Promise<void> {
    await db("delivery_radar_group_orders")
      .whereNotIn(
        "orderId",
        db("orders")
          .select("id")
          .whereRaw(
            `LOWER("status") IN (${GROUPABLE_ORDER_STATUSES.map(() => "?").join(", ")})`,
            GROUPABLE_ORDER_STATUSES
          )
      )
      .del();
  }

  static async getGroups(): Promise<DeliveryRadarGroup[]> {
    await this.removeStaleOrders();

    const groups = await db("delivery_radar_groups")
      .select("id", "name", "color", "createdAt")
      .orderBy("createdAt", "asc")
      .orderBy("id", "asc");
    const links = await db("delivery_radar_group_orders")
      .select("orderId", "groupId")
      .orderBy("createdAt", "asc");

    const orderIdsByGroup = new Map<string, string[]>();
    for (const link of links) {
      const list = orderIdsByGroup.get(link.groupId) || [];
      list.push(link.orderId);
      orderIdsByGroup.set(link.groupId, list);
    }

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      orderIds: orderIdsByGroup.get(g.id) || [],
      createdAt: new Date(g.createdAt).toISOString(),
    }));
  }

  // Next default group number for today (local day of this POS). Keeps going
  // up through the day — deleted/dispatched groups never free their number —
  // and restarts at 1 the next day. The upsert is atomic, so POS creating
  // groups at the same moment get different numbers.
  static async nextGroupNumber(nameTemplate: string): Promise<number> {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    // Used only for the day's first number: continue after default-named
    // groups already created today (e.g. before this counter existed)
    const [before, after] = nameTemplate.split(GROUP_NUMBER_TOKEN);
    let maxToday = 0;
    if (after !== undefined) {
      const todays = await db("delivery_radar_groups")
        .select("name")
        .where("createdAt", ">=", midnight.toISOString());
      for (const { name } of todays) {
        if (typeof name !== "string") continue;
        if (!name.startsWith(before) || !name.endsWith(after)) continue;
        const middle = name.slice(before.length, name.length - after.length);
        if (/^\d+$/.test(middle)) maxToday = Math.max(maxToday, Number(middle));
      }
    }

    const result = await db.raw(
      `INSERT INTO "delivery_radar_group_counters" ("day", "lastNumber")
       VALUES (?, ?)
       ON CONFLICT ("day") DO UPDATE
         SET "lastNumber" = "delivery_radar_group_counters"."lastNumber" + 1
       RETURNING "lastNumber"`,
      [day, maxToday + 1]
    );
    // Earlier days' counters are no longer needed
    await db("delivery_radar_group_counters").where("day", "<", day).del();
    return Number(result.rows[0].lastNumber);
  }

  // A group is created either with an explicit name, or from a name template
  // containing GROUP_NUMBER_TOKEN (e.g. "Grupo __NUM__") filled with the next
  // number of the day
  static async createGroup(data: {
    name?: string;
    nameTemplate?: string;
    color: string;
  }): Promise<DeliveryRadarGroup> {
    let name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name) {
      const template = data.nameTemplate?.includes(GROUP_NUMBER_TOKEN)
        ? data.nameTemplate
        : `${data.nameTemplate?.trim() || "Group"} ${GROUP_NUMBER_TOKEN}`;
      const num = await this.nextGroupNumber(template);
      name = template.replace(GROUP_NUMBER_TOKEN, String(num));
    }
    const now = new Date().toISOString();
    const group = { id: randomUUID(), name, color: data.color };
    await db("delivery_radar_groups").insert({
      ...group,
      createdAt: now,
      updatedAt: now,
    });
    return { ...group, orderIds: [], createdAt: now };
  }

  static async updateGroup(
    id: string,
    updates: { name?: string; color?: string }
  ): Promise<void> {
    const patch: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof updates.name === "string" && updates.name.trim()) {
      patch.name = updates.name.trim();
    }
    if (typeof updates.color === "string" && updates.color) {
      patch.color = updates.color;
    }
    await db("delivery_radar_groups").where({ id }).update(patch);
  }

  // Order links are removed by ON DELETE CASCADE
  static async deleteGroup(id: string): Promise<void> {
    await db("delivery_radar_groups").where({ id }).del();
  }

  // Adds orders to a group, moving them out of any other group in one step
  static async addOrdersToGroup(
    groupId: string,
    orderIds: string[]
  ): Promise<void> {
    if (orderIds.length === 0) return;
    const now = new Date().toISOString();
    await db("delivery_radar_group_orders")
      .insert(orderIds.map((orderId) => ({ orderId, groupId, createdAt: now })))
      .onConflict("orderId")
      .merge(["groupId", "createdAt"]);
  }

  static async removeOrdersFromGroups(orderIds: string[]): Promise<void> {
    if (orderIds.length === 0) return;
    await db("delivery_radar_group_orders").whereIn("orderId", orderIds).del();
  }
}
