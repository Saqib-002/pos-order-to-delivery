import { OrderItem } from "@/types/order";
import { toast } from "react-toastify";
import i18n from "../../i18n";
import {
  calculateOrderTotal,
  calculateTaxPercentage,
} from "./orderCalculations";

export const fetchConnectedPrinters = async (
  token: string | null,
  setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
  const res = await (window as any).electronAPI.getConnectedPrinters(token);
  if (!res.status) {
    setPrinters([]);
    toast.error(i18n.t("printerUtils.unableToGetPrinters"));
    return;
  }
  setPrinters(res.data);
};
export const fetchPrinters = async (
  token: string | null,
  setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
  const res = await (window as any).electronAPI.getAllPrinters(token);
  if (!res.status) {
    setPrinters([]);
    toast.error(i18n.t("printerUtils.unableToGetPrinters"));
    return;
  }
  setPrinters(res.data);
};
export const groupItemsByPrinter = (
  items: OrderItem[]
): Record<string, OrderItem[]> => {
  const printerGroups: Record<string, OrderItem[]> = {};
  items.forEach((item) => {
    item.printers?.forEach((printerStr) => {
      const printerName = printerStr.split("|")[1];
      const printerIsMain = printerStr.split("|")[2];
      if (!printerGroups[`${printerName}|${printerIsMain}`]) {
        printerGroups[`${printerName}|${printerIsMain}`] = [];
      }
      printerGroups[`${printerName}|${printerIsMain}`].push(item);
    });
  });

  return printerGroups;
};
export const generateReceiptHTML = (
  items: OrderItem[],
  configurations: any,
  orderId: string,
  orderType: string | undefined,
  userRole: string,
  status: string,
  t: (key: string) => string,
  customerAddress: string | undefined
): string => {
  const { nonMenuItems, groups, orderTotal } = calculateOrderTotal(items);

  const prioritySort = (a: OrderItem, b: OrderItem) =>
    (a.productPriority || 0) - (b.productPriority || 0);

  const sortedNonMenuItems = nonMenuItems.sort(prioritySort);
  const sortedGroups = groups.map((group) => ({
    ...group,
    items: group.items.sort(prioritySort),
  }));

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateTimeStr = `${dateStr} - ${timeStr}`;

  const taxBreakdown: Record<
    string,
    { base: number; tax: number; rate: number }
  > = {};
  switch (status.toUpperCase()){
    case "PAID":
      status = t("receipt.paymentStatus.paid");
      break;
    case "UNPAID":
      status = t("receipt.paymentStatus.unpaid");
      break;
    case "PARTIAL":
      status = t("receipt.paymentStatus.PARTIAL");
      break;
  }
  switch (orderType?.toUpperCase()){
    case "DELIVERY":
      orderType = t("receipt.orderType.delivery");
      break;
    case "PICKUP":
      orderType = t("receipt.orderType.pickup");
      break;
    case "DINE-IN":
      orderType = t("receipt.orderType.dineIn");
      break;
  }

  sortedGroups.forEach((group) => {
    const sectionQty = group.items[0]?.quantity || 1;
    const base = group.basePrice;
    const tax = group.taxPerUnit;
    const rate = calculateTaxPercentage(base, tax);
    const rateKey = `${Math.round(rate)}%`;

    if (!taxBreakdown[rateKey]) {
      taxBreakdown[rateKey] = { base: 0, tax: 0, rate: parseFloat(rateKey) };
    }
    taxBreakdown[rateKey].base += base * sectionQty;
    taxBreakdown[rateKey].tax += tax * sectionQty;
  });

  sortedNonMenuItems.forEach((item) => {
    const base = item.productPrice || 0;
    const tax = item.productTax || 0;
    const rate = calculateTaxPercentage(base, tax);
    const rateKey = `${Math.round(rate)}%`;

    if (!taxBreakdown[rateKey]) {
      taxBreakdown[rateKey] = { base: 0, tax: 0, rate: parseFloat(rateKey) };
    }
    taxBreakdown[rateKey].base += base * item.quantity;
    taxBreakdown[rateKey].tax += tax * item.quantity;
  });

  let html = `
    <html>
        <head>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 70mm; margin: 0; padding: 1mm;  }
            .line { width: 100%; height: 1px; background: black; margin: 5px 0; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .left { text-align: left; }
            .order-info { margin: 0 0 24px 0; } 
            .order-info h1 { margin: 0 0 4px 0; } 
            .order-info p { margin: 0 0 2px 0; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size:12px; }
            thead { border-bottom:1px solid black; font-weight: semibold; }
            th, td { padding: 2px; text-align: left; vertical-align: top; }
            .qty-col { width: 10%; text-align: center; }
            .sub-col { width: 20%; text-align: right; }
            .total-col { width: 20%; text-align: right; }
            .name-col { width: 50%; }
            .sub-item { padding-left: 20px; font-size: 11px; }
            .indent { padding-left: 30px; }
            .total-row { font-weight: bold; border-top: 2px solid black; }
            .vat-table th, .vat-table td { text-align: right; }
            .vat-table .name-col { text-align: left; }
        </style>
        </head>
        <body>
        <div class="center">
            <h2 class="bold">${configurations.name}</h2>
            <p>${configurations.address}</p>
            ${configurations.vatNumber ? `<p>${configurations.vatNumber}</p>` : ""}
        </div>
        <div class="line"></div>
        <div class="order-info center">
            <h1 class="bold" style="font-size: 24px;">${configurations.orderPrefix}${orderId}</h1>
        </div>
        <div class="order-info left">
            <p><span class="bold">${t("receipt.date")}:</span> ${dateTimeStr}</p>
            <p><span class="bold">${t("receipt.order")}:</span> ${configurations.orderPrefix}${orderId}(${orderType?.toUpperCase() || "N/A"})</p>
            <p><span class="bold">${t("receipt.payment")}:</span> ${status}</p>
            <p><span class="bold">${t("receipt.servedBy")}:</span> ${userRole}</p>
            <p><span class="bold">${t("receipt.address")}:</span> ${customerAddress}</p>
            <div class="line"></div>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="qty-col">${t("receipt.quantity")}</th>
                    <th class="name-col">${t("receipt.name")}</th>
                    <th class="sub-col">${t("receipt.subtotal")}</th>
                    <th class="total-col">${t("receipt.total")}</th>
                </tr>
            </thead>
            <tbody>
    `;

  sortedGroups.forEach((group) => {
    const sectionQty = group.items[0]?.quantity || 1;
    const menuPrice = group.basePrice;
    const menuTax = group.taxPerUnit;
    const supplementTotal = group.supplementTotal;

    const menuGroupPrice = (menuPrice + menuTax + supplementTotal) * sectionQty;
    const variantsAndComplementsTotal = group.items.reduce(
      (itemTotal, item) => {
        const complementsTotal = Array.isArray(item.complements)
          ? item.complements.reduce(
              (sum, complement) => sum + complement.price,
              0
            )
          : 0;
        return (
          itemTotal +
          ((item.variantPrice || 0) + complementsTotal) * item.quantity
        );
      },
      0
    );

    const totalGroupPrice = menuGroupPrice + variantsAndComplementsTotal;

    html += `
                <tr class="bold">
                    <td class="qty-col">${sectionQty}</td>
                    <td class="name-col">${group.menuName}</td>
                    <td class="sub-col">€${menuPrice.toFixed(2)}</td>
                    <td class="total-col">€${totalGroupPrice.toFixed(2)}</td>
                </tr>
        `;
    group.items.forEach((item) => {
      html += `
                ${
                  item.supplement
                    ? `<tr>
                    <td class="qty-col"></td>
                    <td class="name-col sub-item">${t("receipt.extra")}:${item.supplement}</td>
                    <td class="sub-col"></td>
                    <td class="total-col">€${item.supplement.toFixed(2)}</td>
                </tr>
                `
                    : ""
                }
                <tr class="bold">
                    <td class="qty-col"></td>
                    <td class="name-col sub-item">${item.productName} ${item.variantName && item.variantId ? `(${item.variantName})` : ""}</td>
                    <td class="sub-col"></td>
                    <td class="total-col"></td>
                </tr>
                ${
                  item.variantPrice && item.variantPrice > 0
                    ? `<tr class="bold">
                    <td class="qty-col"></td>
                    <td class="name-col sub-item indent">${item.variantName}</td>
                    <td class="sub-col"></td>
                    <td class="total-col">€${item.variantPrice.toFixed(2)}</td>
                </tr>`
                    : ""
                }
            `;
      item.complements.forEach((comp) => {
        html += `
                     <tr>
                         <td class="qty-col"></td>
                         <td class="name-col sub-item indent">${comp.itemName}</td>
                         <td class="sub-col"></td>
                         <td class="total-col">€${comp.price.toFixed(2)}</td>
                     </tr>
                 `;
      });
    });
  });

  sortedNonMenuItems.forEach((item) => {
    const complementsTotal = Array.isArray(item.complements)
      ? item.complements.reduce(
          (complementSum, complement) => complementSum + complement.price,
          0
        )
      : 0;

    const subtotal =
      item.productPrice +
      item.productTax +
      item.variantPrice +
      complementsTotal;
    const discountAmount = (subtotal * item.productDiscount) / 100;
    const itemTotal = (subtotal - discountAmount) * item.quantity;

    const unitPrice = item.productPrice + item.productTax;
    html += `
            <tr class="bold">
                <td class="qty-col">${item.quantity}</td>
                <td class="name-col">${item.productName} ${item.variantName && item.variantId ? `(${item.variantName})` : ""}</td>
                <td class="sub-col">€${unitPrice.toFixed(2)}</td>
                <td class="total-col">€${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    if (item.variantPrice && item.variantPrice > 0) {
      html += `
            <tr class="bold">
                <td class="qty-col"></td>
                <td class="name-col sub-item">${item.variantName}</td>
                <td class="sub-col"></td>
                <td class="total-col">€${item.variantPrice.toFixed(2)}</td>
            </tr>
        `;
    }
    item.complements.forEach((comp) => {
      html += `
                 <tr>
                     <td class="qty-col"></td>
                     <td class="name-col sub-item">${comp.itemName}</td>
                     <td class="sub-col"></td>
                     <td class="total-col">€${comp.price.toFixed(2)}</td>
                 </tr>
             `;
    });
  });

  html += `
            </tbody>
        </table>
        <div class="total-row center">
            <table style="width: 100%; margin: 10px 0;">
                <tr><td class="qty-col"></td><td class="name-col"></td><td class="sub-col bold">${t("receipt.total")}</td><td class="total-col bold">€${orderTotal.toFixed(2)}</td></tr>
            </table>
        </div>
        <div class="line"></div>
        <table class="vat-table">
            <thead>
                <tr>
                    <th class="name-col">${t("receipt.vat")}</th>
                    <th class="sub-col">${t("receipt.base")}</th>
                    <th class="total-col">${t("receipt.tax")}</th>
                </tr>
            </thead>
            <tbody>
    `;

  // VAT rows
  Object.entries(taxBreakdown).forEach(([rateKey, { base, tax }]) => {
    html += `
                <tr>
                    <td class="name-col">${rateKey}</td>
                    <td class="sub-col">€${base.toFixed(2)}</td>
                    <td class="total-col">€${tax.toFixed(2)}</td>
                </tr>
        `;
  });

  html += `
            </tbody>
        </table>
        <div class="line"></div>
        <div class="center"><small>${t("receipt.thankYou")}</small></div>
        </body>
    </html>
    `;
  return html;
};
export const generateItemsReceiptHTML = (
  items: OrderItem[],
  configurations: any,
  order: any,
  userRole: string,
  status: string,
  t: (key: string) => string
): string => {
  const { nonMenuItems, groups } = calculateOrderTotal(items);

  const prioritySort = (a: OrderItem, b: OrderItem) =>
    (a.productPriority || 0) - (b.productPriority || 0);

  const sortedNonMenuItems = nonMenuItems.sort(prioritySort);
  const sortedGroups = groups.map((group) => ({
    ...group,
    items: group.items.sort(prioritySort),
  }));
  switch (status.toUpperCase()){
    case "PAID":
      status = t("receipt.paymentStatus.paid");
      break;
    case "UNPAID":
      status = t("receipt.paymentStatus.unpaid");
      break;
    case "PARTIAL":
      status = t("receipt.paymentStatus.PARTIAL");
      break;
  }
  switch (order.orderType?.toUpperCase()){
    case "DELIVERY":
      order.orderType = t("receipt.orderType.delivery");
      break;
    case "PICKUP":
      order.orderType = t("receipt.orderType.pickup");
      break;
    case "DINE-IN":
      order.orderType = t("receipt.orderType.dineIn");
      break;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateTimeStr = `${dateStr} - ${timeStr}`;

  let html = `
    <html>
        <head>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 70mm; margin: 0; padding: 1mm;  }
            .line { width: 100%; height: 1px; background: black; margin: 5px 0; }
            .bold { font-weight: bold; font-size: 16px; }
            .center { text-align: center; }
            .left { text-align: left; }
            .order-info { margin: 0 0 24px 0; } 
            .order-info h1 { margin: 0 0 4px 0; } 
            .order-info p { margin: 0 0 2px 0; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size:12px; }
            thead { border-bottom:1px solid black; font-weight: semibold; }
            th, td { padding: 2px; text-align: left; vertical-align: top; }
            .qty-col { width: 10%; text-align: center; }
            .sub-col { width: 20%; text-align: right; }
            .total-col { width: 20%; text-align: right; }
            .name-col { width: 50%; }
            .sub-item { padding-left: 20px; font-size: 14px; }
            .indent { padding-left: 30px; }
            .total-row { font-weight: bold; border-top: 2px solid black; }
            .vat-table th, .vat-table td { text-align: right; }
            .vat-table .name-col { text-align: left; }
        </style>
        </head>
        <body>
        <div class="order-info center">
            <h1 class="bold" style="font-size: 24px;">${configurations.orderPrefix}${order.orderId}</h1>
            <h1 class="bold" style="font-size: 16px;">${order.orderType.toUpperCase()}</h1>
            <p>${dateTimeStr}</p>
            <p>${status}</p>
        </div>
        <div class="line"></div>
        <div>
    `;

  // Menu groups - MODIFIED to use sortedGroups
  sortedGroups.forEach((group) => {
    // Sub-items and their complements - This loop now uses sorted items
    html += `
                    <div class="name-col bold">${group.menuName}</div>
        `;
    group.items.forEach((item) => {
      html += `
            <div class="sub-item bold">
            ${item.productName} ${item.variantId ? "-" : ""} ${item.variantName && item.variantId ? `(${item.variantName})` : ""}
            </div>
            <div class="indent">
            ${item.supplement ? `${t("receipt.extra")}: ${item.supplement}` : ""}
            </div>
            `;
      item.complements.forEach((comp) => {
        html += `
                <div class="indent">
                ${comp.itemName}
                </div>
                `;
      });
    });
  });

  // Non-menu items - MODIFIED to use sortedNonMenuItems
  sortedNonMenuItems.forEach((item) => {
    html += `
            <div class="bold">
                ${item.productName} ${item.variantId ? "-" : ""} ${item.variantName && item.variantId ? `(${item.variantName})` : ""}
            </div>
        `;
    item.complements.forEach((comp) => {
      html += `
                <div class="sub-item">
                 ${comp.itemName}
                </div>
                `;
    });
  });

  html += `
        </div>
        <div class="line"></div>
        <div>
            ${t("receipt.order")} ${configurations.orderPrefix}${order.orderId} - ${dateTimeStr}
        </div>
        <div class="center">
            ${t("receipt.waiter")}: ${order.deliveryPersonName ? order.deliveryPersonName : "N/A"}
        </div>
    `;

  return html;
};
