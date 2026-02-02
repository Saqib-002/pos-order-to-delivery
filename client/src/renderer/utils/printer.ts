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
      const parts= printerStr.split("|");
      const printerName = parts[1];
      const printerIsMain = parts[2];
      if(parts.length<3) return;
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
  customerAddress: string | undefined,
  pickupTime: string | undefined,
  customerPhone: string | undefined,
  customerName: string | undefined,
  userName?: string,
  notes?: string,
  amountPaid?: number
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

  const originalOrderType = orderType?.toUpperCase();
  const rawStatus = status.toUpperCase();

  switch (status.toUpperCase()) {
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

  let orderTypeLabel = orderType?.toUpperCase() || "";
  switch (orderType?.toUpperCase()) {
    case "DELIVERY":
      orderTypeLabel = t("receipt.orderType.delivery");
      break;
    case "PICKUP":
      orderTypeLabel = t("receipt.orderType.pickup");
      break;
    case "DINE-IN":
      orderTypeLabel = t("receipt.orderType.dineIn");
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

  let displayPaid = 0;
  let footerLabel = "";

  if (rawStatus === "PAID") {
    displayPaid = orderTotal;
    footerLabel = t("receipt.paymentStatus.paidLabel");
  } else if (rawStatus === "PARTIAL") {
    displayPaid = amountPaid || 0;
    footerLabel = t("receipt.paymentStatus.partialLabel");
  } else {
    displayPaid = 0;
    footerLabel = t("receipt.paymentStatus.unpaidLabel");
  }

  let html = `
    <html>
        <head>
        <style>
            body { font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace; font-size: 13px; width: 72mm; margin: 0; padding: 0; color: #000; }
            .container { padding: 1mm 2mm; }
            .dashed-line { border-top: 1px dashed black; margin: 10px 0; width: 100%; height:0; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .left { text-align: left; }
            .right { text-align: right; }
            .large { font-size: 18px; }
            .extra-large { font-size: 24px; }
            
            .header { margin-bottom: 5px; line-height: 1.2; }
            .order-type-header { margin: 10px 0; }
            
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
            th { text-align: left; }
            td { vertical-align: top; padding: 1px 0; }
            
            .item-qty { width: 10%; }
            .item-name { width: 65%; }
            .item-total { width: 20%; text-align: right; }
            
            .sub-item { padding-left: 5px; font-size: 12px; }
            .indent { padding-left: 20px; }
            
            .total-section { margin-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .main-total { font-size: 16px; margin: 10px 0; }
            
            .footer-header { font-size: 18px; margin: 15px 0; border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; }
            .client-details { font-size: 12px; line-height: 1.4; margin-bottom: 10px; }
            .client-details-header { padding-top: 5px; margin-top: 10px; font-weight: bold; margin-bottom: 5px; }
            .vat-table { font-size: 11px; margin-top: 20px; }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="center header">
                <div class="bold" style="font-size: 16px;">${configurations.name}</div>
                <div>${configurations.address}</div>
                ${configurations.vatNumber ? `<div>${configurations.vatNumber}</div>` : ""}
            </div>

            <div class="dashed-line"></div>

            <div class="center">
                <div class="bold large order-type-header">${orderTypeLabel}</div>
                <div class="bold">${t("receipt.date")}: ${dateTimeStr}</div>
                <div class="bold extra-large" style="margin: 15px 0;">${configurations.orderPrefix}${orderId}</div>
            </div>

            <div class="dashed-line"></div>

            <table>
                <thead>
                    <tr>
                        <th colspan="2" class="bold">${t("receipt.name")}</th>
                        <th class="right bold">EUR</th>
                    </tr>
                </thead>
                <tbody>
    `;

  // --- Start of Grouping and Sorting Logic ---
  const categorizedGroups: Array<{
    name: string;
    priority: number;
    isMenu: boolean;
    data: any;
  }> = [];

  const menuSubcategoryMap: Record<string, { priority: number; groups: any[] }> = {};
  groups.forEach((group) => {
    const firstItem = group.items[0];
    const catName = firstItem?.subCategoryName || "";
    const catPriority = firstItem?.subCategoryPriority ?? -1;
    const menuHeader = `${t("receipt.category.menus")}${catName ? ` / ${catName}` : ""}`;
    
    if (!menuSubcategoryMap[menuHeader]) {
      menuSubcategoryMap[menuHeader] = {
        priority: catPriority,
        groups: [],
      };
    }
    menuSubcategoryMap[menuHeader].groups.push({
      ...group,
      items: group.items.sort(prioritySort),
    });
  });

  Object.entries(menuSubcategoryMap).forEach(([name, info]) => {
    categorizedGroups.push({
      name,
      priority: info.priority,
      isMenu: true,
      data: info.groups,
    });
  });

  const subcategoryMap: Record<
    string,
    { priority: number; items: OrderItem[] }
  > = {};
  nonMenuItems.forEach((item) => {
    const catName = item.subCategoryName || "";
    const catPriority = item.subCategoryPriority ?? 999;

    if (!subcategoryMap[catName]) {
      subcategoryMap[catName] = {
        priority: catPriority,
        items: [],
      };
    }
    subcategoryMap[catName].items.push(item);
  });

  Object.entries(subcategoryMap).forEach(([name, info]) => {
    categorizedGroups.push({
      name,
      priority: info.priority,
      isMenu: false,
      data: info.items.sort(prioritySort),
    });
  });

  categorizedGroups.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });

  categorizedGroups.forEach((category) => {
    if (category.name) {
      html += `
                <tr class="bold">
                    <td colspan="3" style="padding: 10px 0 5px 0; text-transform: uppercase; font-size: 14px;">${category.name}</td>
                </tr>
      `;
    }

    if (category.isMenu) {
      (category.data as any[]).forEach((group) => {
        const sectionQty = group.items[0]?.quantity || 1;
        const menuPrice = group.basePrice;
        const menuTax = group.taxPerUnit;
        const supplementTotal = group.supplementTotal;
        const menuGroupPrice = (menuPrice + menuTax + supplementTotal) * sectionQty;
        
        const variantsAndComplementsTotal = group.items.reduce(
          (itemTotal: number, item: any) => {
            const complementsTotal = Array.isArray(item.complements)
              ? item.complements.reduce(
                  (sum: number, complement: any) => sum + complement.price,
                  0
                )
              : 0;
          return itemTotal + ((item.variantPrice || 0) + complementsTotal) * item.quantity;
        }, 0);

        const totalGroupPrice = menuGroupPrice + variantsAndComplementsTotal;

        html += `
                <tr class="bold">
                    <td class="item-qty">${sectionQty} X</td>
                    <td class="item-name">${group.menuName}</td>
                    <td class="item-total">${totalGroupPrice.toFixed(2)}</td>
                </tr>
        `;

        group.items.forEach((item: OrderItem) => {
          html += `
                <tr>
                    <td class="item-qty"></td>
                    <td class="item-name sub-item">• ${item.productName}</td>
                    <td class="item-total">${item.supplement && item.supplement > 0 ? item.supplement.toFixed(2) : ""}</td>
                </tr>
          `;

          if (item.variantId && item.variantName) {
            html += `
                <tr>
                    <td class="item-qty"></td>
                    <td class="item-name sub-item indent">${item.variantName}</td>
                    <td class="item-total">${item.variantPrice && item.variantPrice > 0 ? item.variantPrice.toFixed(2) : ""}</td>
                </tr>
            `;
          }

          if (Array.isArray(item.complements) && item.complements.length > 0) {
            item.complements.forEach((comp) => {
              html += `
                <tr>
                    <td class="item-qty"></td>
                    <td class="item-name sub-item indent">${comp.forProduct ? "✓" : "+"} ${comp.itemName}</td>
                    <td class="item-total">${comp.price.toFixed(2)}</td>
                </tr>
              `;
            });
          }
        });
        html += `<tr style="height: 8px;"><td colspan="3"></td></tr>`;
      });
    } else {
      (category.data as OrderItem[]).forEach((item) => {
        const complementsTotal = Array.isArray(item.complements)
          ? item.complements.reduce((sum, complement) => sum + complement.price, 0)
          : 0;

        const subtotal = item.productPrice + item.productTax + item.variantPrice + complementsTotal;
        const discountAmount = (subtotal * item.productDiscount) / 100;
        const itemTotal = (subtotal - discountAmount) * item.quantity;

        html += `
                <tr class="bold">
                    <td class="item-qty">${item.quantity} X</td>
                    <td class="item-name">${item.productName}</td>
                    <td class="item-total">${itemTotal.toFixed(2)}</td>
                </tr>
        `;

        if (item.variantId && item.variantName) {
          html += `
                <tr>
                    <td class="item-qty"></td>
                    <td class="item-name sub-item">${item.variantName}</td>
                    <td class="item-total">${item.variantPrice > 0 ? item.variantPrice.toFixed(2) : ""}</td>
                </tr>
          `;
        }

        if (Array.isArray(item.complements) && item.complements.length > 0) {
          item.complements.forEach((comp) => {
            html += `
                <tr>
                    <td class="item-qty"></td>
                    <td class="item-name sub-item indent">${comp.forProduct ? "✓" : "+"} ${comp.itemName}</td>
                    <td class="item-total">${comp.price.toFixed(2)}</td>
                </tr>
            `;
          });
        }
        html += `<tr style="height: 8px;"><td colspan="3"></td></tr>`;
      });
    }
  });
  // --- End of Grouping and Sorting Logic ---

  html += `
                </tbody>
            </table>

            <div class="dashed-line"></div>

            <div class="total-section">
                <div class="total-row bold main-total">
                    <span>${t("receipt.total")}</span>
                    <span>${orderTotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>${t("receipt.payment")}:</span>
                    <span>${displayPaid.toFixed(2)}</span>
                </div>
                ${rawStatus === "PARTIAL" ? `
                <div class="total-row">
                    <span>${t("receipt.remaining")}:</span>
                    <span>${(orderTotal - displayPaid).toFixed(2)}</span>
                </div>
                ` : ""}
            </div>
            
            <div class="center bold footer-header">
                ${footerLabel}
            </div>

            <div class="client-details">
                <div class="client-details-header">${t("receipt.clientDetails")}</div>
                ${customerName ? `<div class="bold">${customerName}</div>` : ""}
                ${customerAddress ? `<div>${customerAddress}</div>` : ""}
                ${customerPhone ? `<div>${customerPhone}</div>` : ""}
                ${pickupTime ? `<div><span class="bold">${t("receipt.pickupTime")}:</span> ${pickupTime}</div>` : ""}
                ${notes ? `<div style="margin-top:5px;"><span class="bold">${t("receipt.notes")}:</span> ${notes}</div>` : ""}
                <div style="margin-top:5px;"><span class="bold">${t("receipt.servedBy")}:</span> ${userName || userRole}</div>
            </div>

            <div class="dashed-line"></div>
            
            <table class="vat-table">
                <thead>
                    <tr>
                        <th class="bold">${t("receipt.vat")}</th>
                        <th class="right bold">${t("receipt.base")}</th>
                        <th class="right bold">${t("receipt.tax")}</th>
                    </tr>
                </thead>
                <tbody>
    `;

  Object.entries(taxBreakdown).forEach(([rateKey, { base, tax }]) => {
    html += `
                <tr>
                    <td>${rateKey}</td>
                    <td class="right">${base.toFixed(2)}</td>
                    <td class="right">${tax.toFixed(2)}</td>
                </tr>
        `;
  });

  html += `
                </tbody>
            </table>

            <div class="center" style="margin-top: 20px;">
                <small>${t("receipt.thankYou")}</small>
            </div>
        </div>
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

  switch (status.toUpperCase()) {
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
  switch (order.orderType?.toUpperCase()) {
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
            body { font-family: sans-serif, 'Courier New', monospace; font-size: 12px; width: 70mm; margin: 0; padding: 1mm;  }
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
            <p class="bold" style="font-size: 14px;">${dateTimeStr}</p>
            <p class="bold" style="font-size: 14px;">${status}</p>
        </div>
        <div class="line"></div>
        <div>
    `;

  // --- Start of Grouping and Sorting Logic ---
  const categorizedGroups: Array<{
    name: string;
    priority: number;
    isMenu: boolean;
    data: any;
  }> = [];

  const menuSubcategoryMap: Record<string, { priority: number; groups: any[] }> = {};
  groups.forEach((group) => {
    const firstItem = group.items[0];
    const catName = firstItem?.subCategoryName || "";
    const catPriority = firstItem?.subCategoryPriority ?? -1;
    const menuHeader = `${t("receipt.category.menus")}${catName ? ` / ${catName}` : ""}`;
    
    if (!menuSubcategoryMap[menuHeader]) {
      menuSubcategoryMap[menuHeader] = {
        priority: catPriority,
        groups: [],
      };
    }
    menuSubcategoryMap[menuHeader].groups.push({
      ...group,
      items: group.items.sort(prioritySort),
    });
  });

  Object.entries(menuSubcategoryMap).forEach(([name, info]) => {
    categorizedGroups.push({
      name,
      priority: info.priority,
      isMenu: true,
      data: info.groups,
    });
  });

  const subcategoryMap: Record<
    string,
    { priority: number; items: OrderItem[] }
  > = {};
  nonMenuItems.forEach((item) => {
    const catName = item.subCategoryName || "";
    const catPriority = item.subCategoryPriority ?? 999;

    if (!subcategoryMap[catName]) {
      subcategoryMap[catName] = {
        priority: catPriority,
        items: [],
      };
    }
    subcategoryMap[catName].items.push(item);
  });

  Object.entries(subcategoryMap).forEach(([name, info]) => {
    categorizedGroups.push({
      name,
      priority: info.priority,
      isMenu: false,
      data: info.items.sort(prioritySort),
    });
  });

  categorizedGroups.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });

  categorizedGroups.forEach((category) => {
    if (category.name) {
      html += `
            <div style="border-bottom: 1px solid #000; padding: 5px 0; margin-top: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase;">
                ${category.name}
            </div>
      `;
    }

    if (category.isMenu) {
      (category.data as any[]).forEach((group) => {
        const sectionQty = group.items[0]?.quantity || 1;
        html += `
                <div class="name-col bold" style="margin-top: 5px;">${sectionQty}x ${group.menuName}</div>
        `;
        group.items.forEach((item: OrderItem) => {
          const supplementText =
            item.supplement && item.supplement > 0
              ? ` (+${item.supplement.toFixed(2)})`
              : "";
          html += `
                <div class="sub-item bold">
                • ${item.quantity}x ${item.productName}${supplementText}
                </div>
                ${
                  item.variantName && item.variantId
                    ? `<div class="indent bold">- ${item.variantName}</div>`
                    : ""
                }
          `;
          item.complements.forEach((comp) => {
            html += `
                <div class="indent">${comp.forProduct ? "✓" : "+"} ${comp.itemName}</div>
            `;
          });
        });
      });
    } else {
      (category.data as OrderItem[]).forEach((item) => {
        html += `
                <div class="bold" style="margin-top: 5px;">
                    ${item.quantity}x ${item.productName}
                </div>
                ${
                  item.variantName && item.variantId
                    ? `<div class="sub-item bold">- ${item.variantName}</div>`
                    : ""
                }
        `;
        item.complements.forEach((comp) => {
          html += `
                <div class="sub-item bold">${comp.forProduct ? "✓" : "+"} ${comp.itemName}</div>
          `;
        });
      });
    }
  });
  // --- End of Grouping and Sorting Logic ---

  html += `
        </div>
        <div class="line"></div>
        <div class="bold">
            ${t("receipt.order")} ${configurations.orderPrefix}${order.orderId} - ${dateTimeStr}
        </div>
        ${order.notes ? `<div class="bold">${t("receipt.notes")}: ${order.notes}</div>` : ""}
        <div class="center bold">
            ${t("receipt.waiter")}: ${order.deliveryPersonName ? order.deliveryPersonName : "N/A"}
        </div>
    `;

  return html;
};
