import type { OrderItem } from "../../types/order";

// Keep the full order quantities intact; only ticket copies contain the delta.
export function getPendingKitchenItems(items: OrderItem[]): OrderItem[] {
  return items.flatMap((item) => {
    const printed = item.kitchenPrintedQuantity ?? (item.isKitchenPrinted ? item.quantity : 0);
    const quantity = Math.max(0, item.quantity - printed);
    return quantity > 0
      ? [{ ...item, quantity, kitchenPrintedQuantity: item.quantity }]
      : [];
  });
}
