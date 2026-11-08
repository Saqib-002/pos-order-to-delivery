import type { Order } from "@/types/order";
import { isPointInPolygon } from "./googleMaps";

// Swipe to kitchen (Orders screen): a pending web/app order is sent to the
// kitchen without opening it. The checks below are the same ones the Process
// button runs, so a swipe never lets through an order Process would refuse.

const SWIPEABLE_ORDER_TYPES = ["web:delivery", "web:pickup", "app:delivery", "app:pickup"];

export const canSwipeToKitchen = (
  order: Pick<Order, "status" | "orderType">,
  isLocked: boolean
): boolean =>
  !isLocked &&
  (order.status || "").toLowerCase() === "pending" &&
  SWIPEABLE_ORDER_TYPES.includes((order.orderType || "").toLowerCase());

export type KitchenCheckResult =
  | { ok: true }
  | { ok: false; messageKey: string; params?: Record<string, string> };

interface ZoneLike {
  name: string;
  points: { lat: number; lng: number }[];
  minOrderAmount: number;
}

export const checkBeforeKitchen = async ({
  order,
  orderTotal,
  restaurantAddress,
  zones,
  locate,
}: {
  order: Order;
  orderTotal: number;
  restaurantAddress?: string | null;
  zones?: ZoneLike[] | null;
  locate: (address: string) => Promise<{ lat: number; lng: number } | null>;
}): Promise<KitchenCheckResult> => {
  // Process cannot run on an order with no items (its cart never opens)
  if (!order.items || order.items.length === 0) {
    return { ok: false, messageKey: "orderComponent.swipeToKitchen.noItems" };
  }

  if (!(order.orderType || "").toLowerCase().endsWith("delivery")) {
    return { ok: true };
  }

  const phone = String(order.customer?.phone || (order as any).customerPhone || "").trim();
  if (!phone) {
    return { ok: false, messageKey: "orderProcessingModal.errors.customerPhoneRequired" };
  }

  const address = String(order.customer?.address || (order as any).customerAddress || "").trim();
  // Process also refuses a delivery order with no customer name
  if (!address || !order.customer?.name) {
    return { ok: false, messageKey: "orderProcessingModal.errors.customerDetailsRequired" };
  }

  // Same as Process: without a restaurant address or a map location for the
  // customer, the zone check is skipped
  if (!restaurantAddress) return { ok: true };

  let location: { lat: number; lng: number } | null = null;
  try {
    location = await locate(address);
  } catch {
    location = null;
  }
  if (!location) return { ok: true };

  const zoneList = zones || [];
  if (zoneList.length === 0) return { ok: true };

  const zone = zoneList.find((z) => isPointInPolygon(location!, z.points || []));
  if (!zone) {
    return { ok: false, messageKey: "orderProcessingModal.errors.outsideDeliveryZones" };
  }

  const minAmount = Number(zone.minOrderAmount) || 0;
  if (orderTotal < minAmount) {
    return {
      ok: false,
      messageKey: "orderProcessingModal.errors.minOrderAmountNotMetZone",
      params: {
        zoneName: zone.name,
        minAmount: minAmount.toFixed(2),
        currentAmount: orderTotal.toFixed(2),
      },
    };
  }

  return { ok: true };
};
