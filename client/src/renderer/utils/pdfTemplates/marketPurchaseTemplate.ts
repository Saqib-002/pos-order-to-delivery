import { MarketPurchase } from "@/types/marketPurchases";
import { calculatePaymentStatus } from "../paymentStatus";

export const generateMarketPurchaseInvoiceHTML = (
  purchase: MarketPurchase,
  configurations: { name?: string; address?: string; vatNumber?: string },
  t: (key: string) => string
): string => {
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "-";
    try {
      let date: Date;
      if (typeof dateString === "string") {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateString + "T00:00:00");
        } else {
          date = new Date(dateString);
        }
      } else {
        date = dateString;
      }

      if (isNaN(date.getTime())) {
        return String(dateString);
      }

      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return String(dateString);
    }
  };

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

  // Calculate totals
  let totalBase = 0;
  let total = 0;
  const taxGroups: { [key: string]: number } = {};

  const items = purchase.items || [];
  const itemsHTML = items
    .map((item) => {
      const unitPrice = Number(item.unitPrice) || 0;
      const totalUnit = Number(item.totalUnit) || 0;
      const tax = Number(item.tax) || 0;
      const itemTotal = Number(item.total) || 0;

      const subtotal = unitPrice * totalUnit;
      const netSubtotal = item.isTaxIncluded ? subtotal - tax : subtotal;
      totalBase += netSubtotal;
      total += itemTotal;

      let taxPercent = 0;
      if (item.isTaxIncluded) {
        const netSub = subtotal - tax;
        if (netSub > 0) taxPercent = (tax / netSub) * 100;
      } else {
        if (subtotal > 0) taxPercent = (tax / subtotal) * 100;
      }

      if (tax > 0 && netSubtotal > 0) {
        const percentStr = taxPercent.toFixed(1);
        if (!taxGroups[percentStr]) {
          taxGroups[percentStr] = 0;
        }
        taxGroups[percentStr] += tax;
      }

      return `
        <tr>
          <td>${item.productName}</td>
          <td>${item.expenseTypeName || "-"}</td>
          <td style="text-align: center;">${item.box}</td>
          <td style="text-align: center;">${item.unit}</td>
          <td style="text-align: center;">${item.totalUnit}</td>
          <td style="text-align: right;">${unitPrice.toFixed(2)}€</td>
          <td style="text-align: right;">${tax > 0 ? `${tax.toFixed(2)}€ (${taxPercent.toFixed(1)}%)` : "-"}</td>
          <td style="text-align: right; font-weight: bold;">${itemTotal.toFixed(2)}€</td>
        </tr>
      `;
    })
    .join("");

  const taxRowsHTML = Object.entries(taxGroups)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([percent, amount]) => `
      <div class="summary-row">
        <span class="summary-label">${t("marketPurchaseManagement.modal.step2.tax")} ${percent}%:</span>
        <span class="summary-value">${amount.toFixed(2)}€</span>
      </div>
    `)
    .join("");

  const paymentStatus = calculatePaymentStatus(purchase.paymentType || "", total);
  const totalPaid = paymentStatus.totalPaid;
  const remainingAmount = paymentStatus.remainingAmount;

  const summaryHTML = `
    <div class="summary-row">
      <span class="summary-label">${t("marketPurchaseManagement.modal.step2.totalBase")}:</span>
      <span class="summary-value">${totalBase.toFixed(2)}€</span>
    </div>
    ${taxRowsHTML}
    <div class="summary-row" style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;">
      <span class="summary-label" style="font-size: 16px;">${t("marketPurchaseManagement.modal.step2.total")}:</span>
      <span class="summary-value" style="font-size: 18px;">${total.toFixed(2)}€</span>
    </div>
    <div class="summary-row" style="border-top: 1px solid #ddd; padding-top: 6px; margin-top: 6px;">
      <span class="summary-label">${t("marketPurchaseManagement.modal.step3.totalPaid")}:</span>
      <span class="summary-value">${totalPaid.toFixed(2)}€</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">${t("marketPurchaseManagement.modal.step3.remaining")}:</span>
      <span class="summary-value" style="color: ${remainingAmount > 0 ? '#b91c1c' : '#000'}">${remainingAmount.toFixed(2)}€</span>
    </div>
  `;

  // Format payment method display for invoice
  let paymentDisplay = purchase.paymentType || "-";
  if (paymentDisplay.includes(":")) {
    paymentDisplay = paymentDisplay
      .split(", ")
      .map((p) => {
        const [type, amount] = p.split(":");
        return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${Number(amount || 0).toFixed(2)}€`;
      })
      .join(", ");
  } else {
    paymentDisplay = paymentDisplay.charAt(0).toUpperCase() + paymentDisplay.slice(1);
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page {
              margin: 15mm;
              size: A4;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 20px;
          }
          .header {
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
          }
          .header-section {
            margin-bottom: 10px;
          }
          .header-section h3 {
            margin: 0 0 5px 0;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .header-section p {
            margin: 2px 0;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          thead {
            background-color: #000;
            color: #fff;
          }
          th {
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          tbody tr:hover {
            background-color: #f5f5f5;
          }
          .summary {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
            width: 300px;
            margin-left: auto;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
            font-size: 12px;
          }
          .summary-label {
            font-weight: bold;
          }
          .summary-value {
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h1>${t("marketPurchaseManagement.invoiceReport.title")}</h1>
            <div style="text-align: right; font-size: 12px;">
              <p><strong>${t("marketPurchaseManagement.table.ticketNumber")}:</strong> ${purchase.ticketNumber}</p>
              <p><strong>${t("marketPurchaseManagement.table.ticketDate")}:</strong> ${formatDate(purchase.ticketDate)}</p>
            </div>
          </div>
          <div class="header-info">
            <div>
              <div class="header-section">
                <h3>${t("marketPurchaseManagement.invoiceReport.buyerInfo")}</h3>
                <p><strong>${configurations.name || t("marketPurchaseManagement.invoiceReport.companyName")}</strong></p>
                ${configurations.address ? `<p>${configurations.address}</p>` : ""}
                ${configurations.vatNumber ? `<p>${t("receipt.vat")}: ${configurations.vatNumber}</p>` : ""}
              </div>
            </div>
            <div>
              <div class="header-section">
                <h3>${t("marketPurchaseManagement.invoiceReport.supplierInfo")}</h3>
                <p><strong>${purchase.supplierName || "-"}</strong></p>
                <p><strong>${t("marketPurchaseManagement.table.paymentType")}:</strong> ${paymentDisplay}</p>
                <p><strong>${t("marketPurchaseManagement.invoiceReport.printDate")}:</strong> ${dateTimeStr}</p>
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${t("marketPurchaseManagement.modal.product")}</th>
              <th>${t("marketPurchaseManagement.modal.expenseType")}</th>
              <th style="text-align: center;">${t("marketPurchaseManagement.modal.box")}</th>
              <th style="text-align: center;">${t("marketPurchaseManagement.modal.unit")}</th>
              <th style="text-align: center;">${t("marketPurchaseManagement.modal.totalUnit")}</th>
              <th style="text-align: right;">${t("marketPurchaseManagement.modal.unitPrice")}</th>
              <th style="text-align: right;">${t("marketPurchaseManagement.modal.tax")}</th>
              <th style="text-align: right;">${t("marketPurchaseManagement.modal.total")}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML || `<tr><td colspan="8" style="text-align: center; padding: 20px;">${t("vehicleManagement.maintenanceModal.table.noRecordsFound")}</td></tr>`}
          </tbody>
        </table>

        <div class="summary">
          ${summaryHTML}
        </div>

        <div class="footer">
          <p>${configurations.name || ""}</p>
          ${configurations.address ? `<p>${configurations.address}</p>` : ""}
          ${configurations.vatNumber ? `<p>${t("receipt.vat")}: ${configurations.vatNumber}</p>` : ""}
        </div>
      </body>
    </html>
  `;
};
