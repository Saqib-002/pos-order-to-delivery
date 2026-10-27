import { Order } from "@/types/order";

export interface CustomRadarGroup {
  id: string;
  name: string;
  color: string;
  orderIds: string[];
  // ISO time the group was created (groups from earlier days are labelled)
  createdAt?: string;
}

// Manual location correction (Fix location / Place on map / Location is
// correct / Look up again). Turned off: correcting pins needs good map and
// area knowledge and time staff don't have during service — drivers call the
// customer instead. The radar still shows which locations look wrong.
// The full feature (UI, shared DB storage, map placement) is kept and
// type-checked; set to true to bring it back.
export const ENABLE_MANUAL_LOCATION_FIXES = false;

// An order the radar could not place on the map, and why
export interface UnlocatedRadarOrder {
  order: Order;
  address: string;
  // Shared geocode cache key, so the order can be placed on the map by hand
  addressKey?: string;
  // lookup_failed: a geocoding service timed out / errored — may work on refresh
  reason: "no_address" | "not_found" | "lookup_failed";
}

export const CUSTOM_GROUP_PALETTE = [
  "#2563EB", // Blue
  "#7C3AED", // Purple
  "#059669", // Emerald
  "#D97706", // Amber
  "#DB2777", // Pink
  "#0891B2", // Cyan
  "#4F46E5", // Indigo
  "#EA580C", // Orange
  "#0D9488", // Teal
  "#E11D48", // Rose
];

// Optimistic local removal of orders from every group (the database is the
// source of truth and is re-read right after). Empty groups are kept.
export const removeOrderIdsFromGroups = (
  groups: CustomRadarGroup[],
  orderIds: string[]
): CustomRadarGroup[] => {
  if (orderIds.length === 0) return groups;
  const toRemove = new Set(orderIds);
  return groups.map((g) =>
    g.orderIds.some((id) => toRemove.has(id))
      ? { ...g, orderIds: g.orderIds.filter((id) => !toRemove.has(id)) }
      : g
  );
};

// Placeholder the server replaces with the next group number of the day.
// Must match GROUP_NUMBER_TOKEN in src/main/database/deliveryRadarGroupsOperations.ts
export const GROUP_NUMBER_TOKEN = "__NUM__";

// First palette color not used by any group, falling back to round-robin
export const getNextGroupColor = (groups: CustomRadarGroup[]) => {
  const used = new Set(groups.map((g) => g.color));
  return (
    CUSTOM_GROUP_PALETTE.find((c) => !used.has(c)) ||
    CUSTOM_GROUP_PALETTE[groups.length % CUSTOM_GROUP_PALETTE.length]
  );
};

export const formatElapsedTime = (minutes: number) => {
  if (minutes < 1) return "< 1m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const getOrderElapsedTime = (order: Order) => {
  const isReady = order.status?.toLowerCase() === "ready for delivery";
  const timestamp = isReady
    ? order.readyAt || order.createdAt
    : order.createdAt;

  if (!timestamp) return { text: "-", minutes: 0, timeStr: "-" };
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  );
  return {
    text: formatElapsedTime(diffMinutes),
    minutes: diffMinutes,
    timeStr: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};
