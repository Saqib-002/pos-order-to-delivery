import { toast } from "react-toastify";
import type { Order, OrderItem } from "@/types/order";
import { generateItemsReceiptHTML, groupItemsByPrinter } from "./printer";
import { getPendingKitchenItems } from "./kitchenPrinting";
import { calculateOrderTotal } from "./orderCalculations";
import { calculatePaymentStatus } from "./paymentStatus";

type Translate = (key: string, options?: any) => string;

/**
 * Prints only the kitchen tickets (never the customer receipt) for the items
 * not yet sent to the kitchen, then marks them printed. Same steps as the
 * kitchen part of processing an order. Printing problems are shown as
 * messages and never undo the order.
 */
export const printKitchenTickets = async ({
  token,
  order,
  items,
  userRole,
  orderPrefix,
  t,
}: {
  token: string | null;
  order: Order;
  items: OrderItem[];
  userRole: string;
  orderPrefix?: string;
  t: Translate;
}): Promise<void> => {
  const api = (window as any).electronAPI;
  try {
    const printerGroups = groupItemsByPrinter(items, order.orderType);
    if (!Object.keys(printerGroups).length) {
      toast.warn(t("orderCart.warnings.noPrintersAttached"));
      return;
    }

    const kitchenJobs = Object.entries(printerGroups)
      .filter(([printer]) => printer.split("|")[1] !== "true")
      .map(([printer, printerItems]) => ({
        printerName: printer.split("|")[0],
        kitchenItems: getPendingKitchenItems(printerItems),
      }))
      .filter((job) => job.kitchenItems.length > 0);

    // Nothing for the kitchen (e.g. only drinks): no ticket, as with Process
    if (kitchenJobs.length === 0) return;

    let configs: any = {
      name: t("orderCart.pointOfSale"),
      address: t("orderCart.defaultAddress"),
      logo: "",
      id: "",
      orderPrefix: orderPrefix || "K",
    };
    const configRes = await api.getConfigurations(token);
    if (!configRes?.status) {
      toast.error(t("orderCart.errors.errorGettingConfigurations"));
      return;
    }
    if (configRes.data) {
      configs = { ...configs, ...configRes.data };
    }

    const { orderTotal } = calculateOrderTotal(items);
    const paymentStatus = calculatePaymentStatus(order.paymentType || "", orderTotal);

    let anyPrinted = false;
    for (const { printerName, kitchenItems } of kitchenJobs) {
      const receiptHTML = generateItemsReceiptHTML(
        kitchenItems,
        configs,
        order,
        userRole,
        paymentStatus.status,
        t
      );
      if (!receiptHTML) continue;

      const printRes = await api.printToPrinter(token, printerName, { html: receiptHTML });
      if (!printRes?.status) {
        if (printRes?.error === t("orderCart.errors.printerNotFoundError")) {
          toast.error(t("orderCart.errors.printerNotFound", { printerName }));
        } else {
          toast.error(t("orderCart.errors.errorPrintingReceipt"));
        }
        continue; // keep printing to the other kitchen printers
      }

      await api.updateOrderItems(
        token,
        kitchenItems.map((item) => ({
          itemId: item.id,
          itemData: {
            isKitchenPrinted: true,
            kitchenPrintedQuantity: item.kitchenPrintedQuantity,
          },
        }))
      );
      anyPrinted = true;
    }

    if (anyPrinted) {
      toast.success(t("orderCart.messages.receiptPrintedSuccessfully"));
    }
  } catch (error) {
    console.error("Failed to print kitchen tickets:", error);
    toast.error(t("orderCart.errors.errorPrintingReceipt"));
  }
};
