import { OrderItem } from "@/types/order";
import { toast } from "react-toastify";
import i18n from "../../i18n";
import {
  calculateOrderTotal,
  calculateTaxPercentage,
} from "./orderCalculations";
import { calculatePaymentStatus } from "./paymentStatus";
import { formatAddress } from "./utils";
import { StringToComplements } from "./order";

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
  items: OrderItem[],
  orderType?: string
): Record<string, OrderItem[]> => {
  const printerGroups: Record<string, OrderItem[]> = {};
  const isPlatform = orderType?.toLowerCase()?.includes("platform");

  items.forEach((item) => {
    item.printers?.forEach((printerStr) => {
      const parts = printerStr.split("|");
      if (parts.length < 3) return;
      const printerName = parts[1];
      const printerIsMainValue = parts[2];
      const isMain = printerIsMainValue === "true";

      if (isPlatform && !isMain) return;

      if (!printerGroups[`${printerName}|${printerIsMainValue}`]) {
        printerGroups[`${printerName}|${printerIsMainValue}`] = [];
      }
      printerGroups[`${printerName}|${printerIsMainValue}`].push(item);
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
  amountPaid?: number,
  paymentType?: string
): string => {
  const { nonMenuItems, groups, orderTotal } = calculateOrderTotal(items);

  const prioritySort = (a: OrderItem, b: OrderItem) =>
    (a.productPriority || 0) - (b.productPriority || 0);

  const sortedNonMenuItems = nonMenuItems.sort(prioritySort);
  const sortedGroups = groups.map((group) => ({
    ...group,
    items: group.items,
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

  const upperType = orderType?.toUpperCase() || "";
  let orderTypeLabel = upperType;
  let orderTypeIcon = "";

  if (
    upperType === "DELIVERY" ||
    upperType.startsWith("WEB:DELIVERY") ||
    upperType.startsWith("PLATFORM:DELIVERY") ||
    upperType.startsWith("APP:DELIVERY")
  ) {
    orderTypeLabel = t("receipt.orderType.delivery") || "A DOMICILIO";
    orderTypeIcon = `<svg style="width:18px; height:18px; display:inline-block; vertical-align:-3px; margin-right:5px;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-4-4zM7 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;
  } else if (
    upperType === "PICKUP" ||
    upperType.startsWith("WEB:PICKUP") ||
    upperType.startsWith("PLATFORM:PICKUP") ||
    upperType.startsWith("APP:PICKUP")
  ) {
    orderTypeLabel = t("receipt.orderType.pickup") || "PARA LLEVAR";
    orderTypeIcon = `<svg style="width:18px; height:18px; display:inline-block; vertical-align:-3px; margin-right:5px;" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-3c0-1.66-1.34-3-3-3S9 4.34 9 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-1c.55 0 1 .45 1 1h-2c0-.55.45-1 1-1zm0 5c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1h2c0 1.66-1.34 3-3 3z"/></svg>`;
  } else if (upperType === "DINE-IN" || upperType === "DINEIN") {
    orderTypeLabel = t("receipt.orderType.dineIn") || "EN SALA";
    orderTypeIcon = `<svg style="width:18px; height:18px; display:inline-block; vertical-align:-3px; margin-right:5px;" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`;
  }

  const isDelivery =
    upperType === "DELIVERY" ||
    upperType.startsWith("WEB:DELIVERY") ||
    upperType.startsWith("PLATFORM:DELIVERY") ||
    upperType.startsWith("APP:DELIVERY");

  const phone =
    configurations?.phone || "";
  const restaurantName = configurations?.name || "ALI DONER KEBAB";
  const restaurantAddress = configurations?.address || "";

  sortedGroups.forEach((group) => {
    const sectionQty = group.items[0]?.quantity || 1;
    const base = group.basePrice;
    const tax = group.taxPerUnit;
    const rate = calculateTaxPercentage(base, tax);
    const rateKey = `${Math.round(rate)}%`;

    const menuDiscount = group.menuDiscount || 0;
    const menuPriceWithTax = group.basePrice + group.taxPerUnit;
    const discountAmount = (menuPriceWithTax * menuDiscount) / 100;
    const menuGroupPrice =
      (menuPriceWithTax - discountAmount + group.supplementTotal) * sectionQty;

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

    const groupTotal = menuGroupPrice + variantsAndComplementsTotal;
    const taxRateDecimal = rate / 100;
    const groupBase =
      rate > 0 ? groupTotal / (1 + taxRateDecimal) : groupTotal;
    const groupTax = groupTotal - groupBase;

    if (!taxBreakdown[rateKey]) {
      taxBreakdown[rateKey] = { base: 0, tax: 0, rate: parseFloat(rateKey) };
    }
    taxBreakdown[rateKey].base += groupBase;
    taxBreakdown[rateKey].tax += groupTax;
  });

  sortedNonMenuItems.forEach((item) => {
    const base = item.productPrice || 0;
    const tax = item.productTax || 0;
    const rate = calculateTaxPercentage(base, tax);
    const rateKey = `${Math.round(rate)}%`;

    const complementsTotal = Array.isArray(item.complements)
      ? item.complements.reduce(
          (complementSum, complement) => complementSum + complement.price,
          0
        )
      : 0;

    const baseProductPriceWithTax = item.productPrice + item.productTax;
    const discountAmount =
      (baseProductPriceWithTax * item.productDiscount) / 100;
    const itemTotal =
      (baseProductPriceWithTax -
        discountAmount +
        item.variantPrice +
        complementsTotal) *
      item.quantity;

    const taxRateDecimal = rate / 100;
    const itemBase = rate > 0 ? itemTotal / (1 + taxRateDecimal) : itemTotal;
    const itemTax = itemTotal - itemBase;

    if (!taxBreakdown[rateKey]) {
      taxBreakdown[rateKey] = { base: 0, tax: 0, rate: parseFloat(rateKey) };
    }
    taxBreakdown[rateKey].base += itemBase;
    taxBreakdown[rateKey].tax += itemTax;
  });

  let displayPaid = 0;
  let footerLabel = "";

  if (rawStatus === "PAID") {
    displayPaid = orderTotal;
    footerLabel = t("receipt.paymentStatus.paidLabel") || "PAGO REALIZADO";
  } else if (rawStatus === "PARTIAL") {
    displayPaid = amountPaid || 0;
    footerLabel = t("receipt.paymentStatus.partialLabel") || "PAGO PARCIAL";
  } else {
    displayPaid = 0;
    footerLabel = t("receipt.paymentStatus.unpaidLabel") || "PAGO PENDIENTE";
  }

  const isSpecialOrder =
    originalOrderType === "PLATFORM" ||
    originalOrderType?.startsWith("PLATFORM:") ||
    originalOrderType?.startsWith("WEB") ||
    originalOrderType?.startsWith("APP");

  const isAlreadyPrefixed =
    typeof orderId === "string" &&
    (orderId.startsWith("A-") ||
      orderId.startsWith("W-") ||
      (configurations?.orderPrefix &&
        orderId.startsWith(configurations.orderPrefix)));

  const displayOrderId =
    isSpecialOrder || isAlreadyPrefixed
      ? orderId
      : `${configurations?.orderPrefix || ""}${orderId}`;

  let html = `
    <!DOCTYPE html>
    <html>
        <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');
            
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            body {
                font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif;
                font-size: 13px;
                width: 72mm;
                margin: 0;
                padding: 1mm 2mm;
                color: #000;
                background: #fff;
            }
            .container { width: 100%; }
            .dashed-line {
                border-top: 1px dashed #000;
                margin: 6px 0;
                width: 100%;
            }
            .bold { font-weight: 800 !important; }
            .center { text-align: center; }
            .left { text-align: left; }
            .right { text-align: right; }

            /* Restaurant Header */
            .header {
                margin-bottom: 4px;
                line-height: 1.2;
            }
            .restaurant-name {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 26px;
                line-height: 1.1;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 3px;
            }
            .restaurant-address {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 400;
                font-size: 13px;
            }
            .restaurant-phone {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 13px;
                margin-top: 2px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            /* Order Header */
            .order-type-container {
                margin: 2px 0;
            }
            .order-type {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            .order-datetime {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 400;
                font-size: 13px;
                margin: 3px 0 6px 0;
            }
            .order-badge-container {
                margin: 4px 0 8px 0;
                text-align: center;
            }
            .order-badge {
                display: inline-block;
                border: 1.5px solid #000;
                border-radius: 6px;
                padding: 2px 26px;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 26px;
                line-height: 1.1;
                letter-spacing: 0.5px;
                min-width: 90px;
            }

            /* Products Header Bar */
            .products-header {
                background-color: #000 !important;
                color: #fff !important;
                display: flex;
                align-items: center;
                padding: 3px 4px;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 12px;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
            }
            .col-cant {
                width: 14%;
                text-align: left;
            }
            .col-desc {
                width: 66%;
                text-align: left;
            }
            .col-precio {
                width: 20%;
                text-align: right;
            }

            /* Categories & Items */
            .category-title {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 15px;
                text-transform: uppercase;
                margin-top: 4px;
                margin-bottom: 2px;
                letter-spacing: 0.5px;
            }
            .item-row {
                display: flex;
                align-items: flex-start;
                line-height: 1.35;
                margin-bottom: 1px;
            }
            .item-product {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 800 !important;
                font-size: 17px;
                text-transform: uppercase;
            }
            .item-extra {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 400;
                font-size: 14px;
                padding-left: 8px;
            }
            .item-price {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 500;
                font-size: 17px;
                text-align: right;
            }
            .bold,
            .item-product,
            .item-product.bold,
            .item-extra.bold,
            .item-price.bold,
            span.bold {
                font-weight: 800 !important;
            }

            /* Totals */
            .total-row-main {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 24px;
                line-height: 1.1;
                margin-top: 4px;
                margin-bottom: 4px;
            }
            .payment-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 400;
                font-size: 13px;
                margin-bottom: 4px;
            }
            .payment-status-banner {
                background-color: #000 !important;
                color: #fff !important;
                text-align: center;
                padding: 4px 0;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 15px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin: 6px 0;
            }

            /* Client Box */
            .client-box {
                border: 1px solid #000;
                border-radius: 6px;
                padding: 4px 8px 8px 8px;
                margin: 6px 0;
                font-family: 'Roboto Condensed', sans-serif;
            }
            .client-header-row {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 5px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            .client-header-line {
                flex: 1;
                border-top: 1px dashed #000;
            }
            .client-header-title {
                padding: 0 6px;
                white-space: nowrap;
            }
            .client-label {
                font-size: 11px;
                font-weight: 400;
                line-height: 1.2;
            }
            .client-name {
                font-size: 12px;
                font-weight: 700;
            }
            .client-address {
                font-size: 12px;
                font-weight: 400;
                line-height: 1.25;
            }
            .client-phone {
                font-size: 12px;
                font-weight: 700;
                margin-top: 1px;
            }
            .client-pickup {
                font-size: 11px;
                font-weight: 400;
                margin-top: 2px;
            }
            .client-notes {
                font-size: 11px;
                font-weight: 400;
                margin-top: 2px;
            }
            .client-served {
                font-size: 11px;
                font-weight: 400;
                margin: 3px 0 6px 0;
            }

            /* VAT Table */
            .vat-header {
                background-color: #000 !important;
                color: #fff !important;
                display: flex;
                justify-content: space-between;
                padding: 2px 6px;
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 10px;
                letter-spacing: 0.5px;
            }
            .vat-row {
                display: flex;
                justify-content: space-between;
                padding: 2px 6px;
                font-family: 'Roboto Condensed', sans-serif;
                font-size: 11px;
                font-weight: 500;
            }
            .vat-col-rate {
                width: 25%;
                text-align: left;
            }
            .vat-col-base {
                width: 45%;
                text-align: center;
            }
            .vat-col-tax {
                width: 30%;
                text-align: right;
            }

            /* Footer */
            .footer-thanks {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 400;
                font-size: 13px;
                margin-top: 6px;
            }
            .footer-restaurant {
                font-family: 'Roboto Condensed', sans-serif;
                font-weight: 700;
                font-size: 16px;
                text-transform: uppercase;
                margin-top: 2px;
                letter-spacing: 0.5px;
            }
        </style>
        </head>
        <body>
        <div class="container">
            <!-- Restaurant Header -->
            <div class="center header">
                <div class="restaurant-name">${restaurantName}</div>
                ${restaurantAddress ? `<div class="restaurant-address">${restaurantAddress}</div>` : ""}
                ${phone ? `<div class="restaurant-phone"><svg style="width:13px; height:13px; display:inline-block; vertical-align:-1px; margin-right:4px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.57 3.9c0-.5-.4-.9-.9-.9H4.11c-.53 0-1 .44-.99.97.43 8.35 7.15 15.07 15.5 15.5.53.01.97-.47.97-1v-3.09c0-.5-.4-.9-.9-.9z"/></svg><span>${phone}</span></div>` : ""}
            </div>

            <div class="dashed-line"></div>

            <!-- Order Header & Badge -->
            <div class="center order-type-container">
                <div class="order-type">${orderTypeIcon}<span>${orderTypeLabel}</span></div>
                <div class="order-datetime">${t("receipt.date") || "Fecha"}: ${dateStr}&nbsp;&nbsp;&nbsp;${t("receipt.time") || "Hora"}: ${timeStr}</div>
                <div class="order-badge-container">
                    <span class="order-badge">${displayOrderId}</span>
                </div>
            </div>

            <!-- Products Header Table Bar -->
            <div class="products-header">
                <span class="col-cant">${(t("receipt.quantity") || "CANT.").toUpperCase()}</span>
                <span class="col-desc">${(t("receipt.description") || "DESCRIPCIÓN").toUpperCase()}</span>
                <span class="col-precio">${(t("receipt.price") || "PRECIO").toUpperCase()}</span>
            </div>
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
    const menuHeader = `${t("receipt.category.menus") || "MENUS"}${catName ? ` / ${catName}` : ""}`;
    
    if (!menuSubcategoryMap[menuHeader]) {
      menuSubcategoryMap[menuHeader] = {
        priority: catPriority,
        groups: [],
      };
    }
    menuSubcategoryMap[menuHeader].groups.push({
      ...group,
      items: group.items,
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
    html += `<div>`;
    if (category.name) {
      html += `<div class="category-title">${category.name}</div>`;
    }

    if (category.isMenu) {
      (category.data as any[]).forEach((group) => {
        const sectionQty = group.items[0]?.quantity || 1;
        const supplementTotal = group.supplementTotal;
        const menuPriceWithTax = group.basePrice + group.taxPerUnit;
        const discountAmountLine = (menuPriceWithTax * group.menuDiscount / 100) * sectionQty;
        const menuBasePrice = (group.basePrice + group.taxPerUnit) * sectionQty;

        html += `
          <div class="item-row">
            <span class="col-cant item-product bold">${sectionQty}  x</span>
            <span class="col-desc item-product bold">${group.menuName}</span>
            <span class="col-precio item-price bold">${menuBasePrice.toFixed(2)}</span>
          </div>
        `;

        group.items.forEach((item: OrderItem) => {
          const itemSupplementTotal = (item.supplement || 0) * item.quantity;
          html += `
            <div class="item-row">
              <span class="col-cant"></span>
              <span class="col-desc item-extra bold">${item.quantity > 1 ? `${item.quantity} x ` : ""}${item.productName}</span>
              <span class="col-precio item-price bold">${itemSupplementTotal.toFixed(2)}</span>
            </div>
          `;

          if (item.variantId && item.variantName) {
            const variantTotal = (item.variantPrice || 0) * item.quantity;
            html += `
              <div class="item-row">
                <span class="col-cant"></span>
                <span class="col-desc item-extra">-  ${item.variantName}</span>
                <span class="col-precio item-price">${variantTotal.toFixed(2)}</span>
              </div>
            `;
          }

          if (Array.isArray(item.complements) && item.complements.length > 0) {
            item.complements.forEach((comp) => {
              const compTotal = comp.price * item.quantity;
              let formattedCompName = comp.itemName;
              if (comp.isRemovalGroup) {
                const cleanName = comp.itemName.replace(/^[-\s]+/, "");
                const displayName = cleanName.toLowerCase().startsWith("sin ") ? cleanName : `Sin ${cleanName}`;
                formattedCompName = `[X] ${displayName}`;
              }
              const isBold = Boolean((comp as any).isBold);
              html += `
                <div class="item-row">
                  <span class="col-cant"></span>
                  <span class="col-desc item-extra ${isBold ? "bold" : ""}">-  ${formattedCompName}</span>
                  <span class="col-precio item-price ${isBold ? "bold" : ""}">${compTotal.toFixed(2)}</span>
                </div>
              `;
            });
          }

          if (item.productNote) {
            html += `
              <div class="item-row">
                <span class="col-cant"></span>
                <span class="col-desc item-extra italic" style="font-size: 13px;">(${t("common.note") || "Nota"}: ${item.productNote})</span>
                <span class="col-precio item-price"></span>
              </div>
            `;
          }
        });

        if (discountAmountLine > 0) {
          html += `
            <div class="item-row">
              <span class="col-cant"></span>
              <span class="col-desc item-extra italic" style="color: #444;">${t("receipt.discount") || "Descuento"} (-${group.menuDiscount}%)</span>
              <span class="col-precio item-price">-${discountAmountLine.toFixed(2)}</span>
            </div>
          `;
        }
      });
    } else {
      (category.data as OrderItem[]).forEach((item) => {
        const productBaseTotal = (item.productPrice + item.productTax) * item.quantity;
        const baseProductPriceWithTax = item.productPrice + item.productTax;
        const discountAmountLine = (baseProductPriceWithTax * item.productDiscount / 100) * item.quantity;

        html += `
          <div class="item-row">
            <span class="col-cant item-product bold">${item.quantity}  x</span>
            <span class="col-desc item-product bold">${item.productName}</span>
            <span class="col-precio item-price bold">${productBaseTotal.toFixed(2)}</span>
          </div>
        `;

        if (item.variantId && item.variantName) {
          const variantTotal = item.variantPrice * item.quantity;
          html += `
            <div class="item-row">
              <span class="col-cant"></span>
              <span class="col-desc item-extra">-  ${item.variantName}</span>
              <span class="col-precio item-price">${variantTotal.toFixed(2)}</span>
            </div>
          `;
        }

          if (Array.isArray(item.complements) && item.complements.length > 0) {
            item.complements.forEach((comp) => {
              const compTotal = comp.price * item.quantity;
              let formattedCompName = comp.itemName;
              if (comp.isRemovalGroup) {
                const cleanName = comp.itemName.replace(/^[-\s]+/, "");
                const displayName = cleanName.toLowerCase().startsWith("sin ") ? cleanName : `Sin ${cleanName}`;
                formattedCompName = `[X] ${displayName}`;
              }
              const isBold = Boolean((comp as any).isBold);
              html += `
                <div class="item-row">
                  <span class="col-cant"></span>
                  <span class="col-desc item-extra ${isBold ? "bold" : ""}">-  ${formattedCompName}</span>
                  <span class="col-precio item-price ${isBold ? "bold" : ""}">${compTotal.toFixed(2)}</span>
                </div>
              `;
            });
          }

        if (item.productNote) {
          html += `
            <div class="item-row">
              <span class="col-cant"></span>
              <span class="col-desc item-extra italic" style="font-size: 13px;">(${t("common.note") || "Nota"}: ${item.productNote})</span>
              <span class="col-precio item-price"></span>
            </div>
          `;
        }

        if (discountAmountLine > 0) {
          html += `
            <div class="item-row">
              <span class="col-cant"></span>
              <span class="col-desc item-extra italic" style="color: #444;">${t("receipt.discount") || "Descuento"} (-${item.productDiscount}%)</span>
              <span class="col-precio item-price">-${discountAmountLine.toFixed(2)}</span>
            </div>
          `;
        }
      });
    }

    html += `</div>`;
    html += `<div class="dashed-line"></div>`;
  });
  // --- End of Grouping and Sorting Logic ---

  html += `
            <!-- Total & Payment -->
            <div class="total-row-main">
                <span class="total-label">${t("receipt.total") || "TOTAL"}</span>
                <span class="total-value">${orderTotal.toFixed(2)} €</span>
            </div>
            <div class="payment-row">
                <span class="payment-label">${t("receipt.payment") || "Pago"}:</span>
                <span class="payment-value">${displayPaid.toFixed(2)} €</span>
            </div>
            ${(orderTotal - displayPaid) > 0.005 ? `
            <div class="payment-row">
                <span class="payment-label">${t("receipt.remaining") || "Pendiente"}:</span>
                <span class="payment-value">${(orderTotal - displayPaid).toFixed(2)} €</span>
            </div>
            ` : ""}

            <div class="payment-status-banner">
                ${footerLabel}
            </div>

            <!-- Client Details Box -->
            <div class="client-box">
                <div class="client-header-row">
                    <span class="client-header-line"></span>
                    <span class="client-header-title">${t("receipt.clientDetails") || "DATOS CLIENTE"}</span>
                    <span class="client-header-line"></span>
                </div>
                ${isDelivery ? `<div class="client-label">${t("receipt.deliveryCustomer") || "Cliente de entrega:"}</div>` : (customerName ? `<div class="client-label">${t("receipt.customer") || "Cliente:"}</div>` : "")}
                ${customerName && !isDelivery ? `<div class="client-name">${customerName}</div>` : ""}
                ${customerAddress ? `<div class="client-address">${customerAddress.replace(/\n/g, "<br>")}</div>` : ""}
                ${customerPhone ? `<div class="client-phone">${customerPhone}</div>` : ""}
                ${pickupTime ? `<div class="client-pickup"><span class="bold">${t("receipt.pickupTime") || "Hora de recogida"}:</span> ${pickupTime}</div>` : ""}
                ${notes ? `<div class="client-notes"><span class="bold">${t("receipt.notes") || "Notas"}:</span> ${notes}</div>` : ""}
                <div class="client-served"><span class="bold">${t("receipt.servedBy") || "Atendido por"}:</span> ${userName || userRole}</div>

                <!-- VAT Table inside Box -->
                <div class="vat-header">
                    <span class="vat-col-rate">${t("receipt.vat") || "IVA"}</span>
                    <span class="vat-col-base">${t("receipt.base") || "BASE"}</span>
                    <span class="vat-col-tax">${t("receipt.tax") || "IMPUESTO"}</span>
                </div>
  `;

  Object.entries(taxBreakdown).forEach(([rateKey, { base, tax }]) => {
    html += `
                <div class="vat-row">
                    <span class="vat-col-rate">${rateKey}</span>
                    <span class="vat-col-base">${base.toFixed(2)}</span>
                    <span class="vat-col-tax">${tax.toFixed(2)}</span>
                </div>
    `;
  });

  html += `
            </div>

            <div class="dashed-line"></div>

            <!-- Footer -->
            <div class="center" style="margin-top: 6px;">
                <div class="footer-thanks">${t("receipt.thankYouOrder") || "¡Gracias por su pedido!"}</div>
                <div class="footer-restaurant">${restaurantName}</div>
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
  let orderTypeDisplay = order.orderType || "";
  switch (orderTypeDisplay?.toUpperCase()) {
    case "DELIVERY":
    case "WEB:DELIVERY":
    case "APP:DELIVERY":
      orderTypeDisplay = t("receipt.orderType.delivery");
      break;
    case "PICKUP":
    case "WEB:PICKUP":
    case "APP:PICKUP":
      orderTypeDisplay = t("receipt.orderType.pickup");
      break;
    case "DINE-IN":
    case "DINEIN":
      orderTypeDisplay = t("receipt.orderType.dineIn");
      break;
    default:
      if (orderTypeDisplay?.toLowerCase().startsWith("platform")) {
        const normalized = orderTypeDisplay.toLowerCase();
        if (normalized === "platform:delivery") orderTypeDisplay = t("orderTypes.platformDelivery");
        else if (normalized === "platform:pickup") orderTypeDisplay = t("orderTypes.platformPickup");
        else if (normalized === "platform") orderTypeDisplay = t("orderTypes.platform");
      }
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
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            body { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif; font-size: 12px; width: 70mm; margin: 0; padding: 1mm; }
            .line { width: 100%; height: 1px; background: black; margin: 5px 0; }
            .bold { font-weight: 800 !important; font-size: 16px; }
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
            <h1 class="bold" style="font-size: 24px;">${order.ticketNumber ? order.ticketNumber : `${configurations.orderPrefix || ""}${order.orderId}`}</h1>
            <h1 class="bold" style="font-size: 16px;">${orderTypeDisplay.toUpperCase()}</h1>
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
      items: group.items,
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
            <div style="border-bottom: 1px solid #000; padding: 5px 0; margin-top: 10px; font-weight: bold; font-size: 17px; text-transform: uppercase;">
                ${category.name}
            </div>
      `;
    }

    if (category.isMenu) {
      (category.data as any[]).forEach((group) => {
        const sectionQty = group.items[0]?.quantity || 1;
        html += `
                <div class="name-col bold" style="margin-top: 5px; font-size: 17px;">${sectionQty}x ${group.menuName}</div>
        `;
        group.items.forEach((item: OrderItem) => {
          const supplementText =
            item.supplement && item.supplement > 0
              ? ` (+${(item.supplement * item.quantity).toFixed(2)})`
              : "";
          html += `
                <div class="sub-item bold">
                • ${item.quantity}x ${item.productName}
                </div>
                ${
                  item.variantName && item.variantId
                    ? `<div class="indent bold">- ${item.variantName}</div>`
                    : ""
                }
          `;
          item.complements.forEach((comp) => {
            let formattedCompName = comp.itemName;
            if (comp.isRemovalGroup) {
              const cleanName = comp.itemName.replace(/^[-\s]+/, "");
              const displayName = cleanName.toLowerCase().startsWith("sin ") ? cleanName : `Sin ${cleanName}`;
              formattedCompName = `[X] ${displayName}`;
            } else {
              formattedCompName = `+ ${comp.itemName}`;
            }
            html += `
                <div class="indent bold">${formattedCompName}</div>
            `;
          });

          if (item.productNote) {
            html += `<div class="italic" style="font-size: 14px; margin-left: 0;">${t("common.note")}: ${item.productNote}</div>`;
          }
        });
      });
    } else {
      (category.data as OrderItem[]).forEach((item) => {
        html += `
                <div class="bold" style="margin-top: 5px; font-size: 17px;">
                    ${item.quantity}x ${item.productName}
                </div>
                ${
                  item.variantName && item.variantId
                    ? `<div class="sub-item bold">- ${item.variantName}</div>`
                    : ""
                }
        `;
        item.complements.forEach((comp) => {
          let formattedCompName = comp.itemName;
          if (comp.isRemovalGroup) {
            const cleanName = comp.itemName.replace(/^[-\s]+/, "");
            const displayName = cleanName.toLowerCase().startsWith("sin ") ? cleanName : `Sin ${cleanName}`;
            formattedCompName = `[X] ${displayName}`;
          } else {
            formattedCompName = `+ ${comp.itemName}`;
          }
          html += `
                <div class="sub-item bold">${formattedCompName}</div>
          `;
        });

        if (item.productNote) {
          html += `<div class="italic" style="font-size: 14px; margin-left: 0;">${t("common.note")}: ${item.productNote}</div>`;
        }
      });
    }
  });
  // --- End of Grouping and Sorting Logic ---

  html += `
        </div>
        <div class="line"></div>
        <div class="bold">
            ${t("receipt.order")} ${order.ticketNumber ? order.ticketNumber : `${configurations.orderPrefix || ""}${order.orderId}`} - ${dateTimeStr}
        </div>
        ${order.notes ? `<div class="bold">${t("receipt.notes")}: ${order.notes}</div>` : ""}
        <div class="center bold">
            ${t("receipt.waiter")}: ${order.deliveryPersonName ? order.deliveryPersonName : "N/A"}
        </div>
    `;

  return html;
};

export interface PrintOrderParams {
  order: any;
  orderItems: any[];
  token: string | null;
  user?: any;
  t: (key: string, options?: any) => string;
}

export const printOrder = async ({
  order,
  orderItems,
  token,
  user,
  t,
}: PrintOrderParams): Promise<boolean> => {
  if (!order || !token) return false;

  try {
    let configurations = {
      name: t("orderCart.pointOfSale") || "Point of Sale",
      address: t("orderCart.defaultAddress") || "",
      logo: "",
      id: "",
      orderPrefix: "K",
    };
    const configRes = await (window as any).electronAPI.getConfigurations(token);
    if (configRes?.status && configRes.data) {
      configurations = { ...configurations, ...configRes.data };
    }

    const printersRes = await (window as any).electronAPI.getAllPrinters(token);
    const allPrinters =
      printersRes?.status && Array.isArray(printersRes.data)
        ? printersRes.data
        : [];
    if (allPrinters.length === 0) {
      toast.warn(t("orderCart.warnings.noPrintersAttached") || "No printers attached.");
      return false;
    }

    const formattedItems: OrderItem[] = (orderItems || []).map((item: any) => {
      let comps = item.complements;
      if (typeof comps === "string") {
        try {
          if (comps.trim().startsWith("[")) {
            comps = JSON.parse(comps);
          } else {
            comps = StringToComplements(comps);
          }
        } catch {
          comps = StringToComplements(comps);
        }
      } else if (!Array.isArray(comps)) {
        comps = [];
      }

      let printerList: string[] = [];
      if (Array.isArray(item.printers)) {
        printerList = item.printers;
      } else if (typeof item.printers === "string" && item.printers) {
        printerList = item.printers.split("=");
      }

      return {
        ...item,
        complements: comps,
        printers: printerList,
      };
    });

    const { orderTotal } = calculateOrderTotal(formattedItems);
    const paymentStatusResult = calculatePaymentStatus(
      order.paymentType || "",
      orderTotal
    );
    const paymentStatus = {
      ...paymentStatusResult,
      status: order.isPaid ? "PAID" : paymentStatusResult.status,
      totalPaid:
        order.isPaid && paymentStatusResult.totalPaid === 0
          ? orderTotal
          : paymentStatusResult.totalPaid,
    };

    let printerGroups = groupItemsByPrinter(formattedItems, order.orderType);
    let mainPrinterName: string | null = null;

    for (const printerKey of Object.keys(printerGroups)) {
      const parts = printerKey.split("|");
      if (parts[1] === "true") {
        mainPrinterName = parts[0];
        break;
      }
    }

    if (!mainPrinterName) {
      const mainPrinterObj =
        allPrinters.find(
          (p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "true"
        ) || allPrinters[0];
      if (mainPrinterObj) {
        mainPrinterName = mainPrinterObj.name;
      }
    }

    if (!mainPrinterName) {
      toast.warn(t("orderCart.warnings.noPrintersAttached") || "No printers attached.");
      return false;
    }

    let customerAddress: string | undefined = undefined;
    const isDelivery =
      order.orderType === "delivery" ||
      order.orderType?.toLowerCase().includes("delivery");
    if (isDelivery) {
      const addr = order?.customer?.address || order?.customerAddress;
      if (addr && typeof addr === "string" && addr.trim()) {
        customerAddress = addr.includes("|") ? formatAddress(addr) : addr;
      }
    }

    let formattedPickupTime: string | undefined = undefined;
    const isPickup =
      order.orderType === "pickup" ||
      order.orderType?.toLowerCase().includes("pickup");
    if (isPickup && order.pickupTime) {
      try {
        const pickupDate = new Date(order.pickupTime);
        if (!isNaN(pickupDate.getTime())) {
          formattedPickupTime = pickupDate.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          formattedPickupTime = order.pickupTime;
        }
      } catch {
        formattedPickupTime = order.pickupTime;
      }
    }

    const customerPhone = order?.customer?.phone || order?.customerPhone;
    const customerName = order?.customer?.name || order?.customerName;

    const ticketOrOrderId = order.ticketNumber
      ? order.ticketNumber
      : order.orderId;

    const receiptHTML = generateReceiptHTML(
      formattedItems,
      configurations,
      ticketOrOrderId,
      order.orderType,
      user?.role || "admin",
      paymentStatus.status,
      t,
      customerAddress,
      formattedPickupTime,
      customerPhone,
      customerName,
      user?.name || "System",
      order.notes || order.customerComments,
      paymentStatus.totalPaid,
      order.paymentType
    );

    if (receiptHTML) {
      const printRes = await (window as any).electronAPI.printToPrinter(
        token,
        mainPrinterName,
        { html: receiptHTML }
      );
      if (!printRes?.status) {
        if (printRes?.error === t("orderCart.errors.printerNotFoundError")) {
          toast.error(t("orderCart.errors.printerNotFound", { printerName: mainPrinterName }));
        } else {
          toast.error(t("orderCart.errors.errorPrintingReceipt"));
        }
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error in printOrder:", err);
    return false;
  }
};

export const printSyncedOrder = async (
  rawOrder: any,
  rawItems: any[],
  token: string | null,
  user: any,
  t: (key: string, options?: any) => string
): Promise<void> => {
  await printOrder({
    order: rawOrder,
    orderItems: rawItems,
    token,
    user,
    t,
  });
};
