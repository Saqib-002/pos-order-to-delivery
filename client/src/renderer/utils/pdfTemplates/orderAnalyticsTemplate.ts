import { translateOrderStatus, translateOrderType } from "../orderStatus";

export const generateOrderAnalyticsReportHTML = (
  analytics: any,
  filters: {
    dateRange: string;
    selectedDate?: string;
    startDateRange?: Date | null;
    endDateRange?: Date | null;
    orderTypeFilter?: string | null;
  },
  configurations: { name?: string; address?: string; vatNumber?: string; orderPrefix?: string },
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

  // Date range display
  let filterPeriod = "-";
  if (filters.dateRange === "today") {
    filterPeriod = `${t("reports.components.dateRangeSelector.periods.today") || "Today"}: ${formatDate(filters.selectedDate || now)}`;
  } else if (filters.dateRange === "week") {
    filterPeriod = t("reports.components.dateRangeSelector.periods.week") || "This Week";
  } else if (filters.dateRange === "month") {
    filterPeriod = t("dateRangePicker.shortcuts.currentMonth") || t("reports.components.dateRangeSelector.periods.month") || "This Month";
  } else if (filters.dateRange === "custom" && filters.startDateRange && filters.endDateRange) {
    filterPeriod = `${formatDate(filters.startDateRange)} - ${formatDate(filters.endDateRange)}`;
  } else {
    filterPeriod = filters.dateRange;
  }

  // Status distribution with color dots
  const statuses = [
    { status: "delivered", key: "totalDelivered", color: "#10b981" },
    { status: "completed", key: "totalCompleted", color: "#10b981" },
    { status: "sent to kitchen", key: "totalSentToKitchen", color: "#f97316" },
    { status: "ready for delivery", key: "totalReadyForDelivery", color: "#06b6d4" },
    { status: "pending", key: "totalPending", color: "#eab308" },
    { status: "out for delivery", key: "totalOutForDelivery", color: "#3b82f6" },
    { status: "cancelled", key: "totalCancelled", color: "#ef4444" },
  ];

  const statusRowsHTML = statuses
    .map((item) => {
      const count = Number(analytics[item.key]) || 0;
      if (count === 0) return "";
      const percent = analytics.totalOrders ? (count / analytics.totalOrders) * 100 : 0;
      const statusLabel = translateOrderStatus(item.status);
      return `
        <div class="item-row">
          <span class="item-label">${statusLabel}</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: ${item.color};"></div>
          </div>
          <span class="item-value">${count} (${Math.round(percent)}%)</span>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  // Hourly distribution
  const maxHourCount = Math.max(...(analytics.hourlyData || []), 1);
  const hourlyRowsHTML = (analytics.hourlyData || [])
    .map((count: number, hour: number) => {
      if (!count) return "";
      const percent = (count / maxHourCount) * 100;
      return `
        <div class="item-row">
          <span class="item-label" style="width: 80px;">${hour.toString().padStart(2, "0")}:00:</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: #6366f1;"></div>
          </div>
          <span class="item-value" style="width: 50px;">${count}</span>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  // Top Items
  const maxItemCount = Math.max(...(analytics.topItems || []).map((t: any) => t.count), 1);
  const topItemsHTML = (analytics.topItems || [])
    .map((item: any, idx: number) => {
      const percent = (item.count / maxItemCount) * 100;
      return `
        <div class="item-row">
          <span class="item-label" style="width: 140px;">#${idx + 1} ${item.name}</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: #10b981;"></div>
          </div>
          <span class="item-value" style="width: 40px;">${item.count}</span>
        </div>
      `;
    })
    .join("");

  // Top Menus
  const maxMenuCount = Math.max(...(analytics.topMenus || []).map((t: any) => t.count), 1);
  const topMenusHTML = (analytics.topMenus || [])
    .map((item: any, idx: number) => {
      const percent = (item.count / maxMenuCount) * 100;
      return `
        <div class="item-row">
          <span class="item-label" style="width: 140px;">#${idx + 1} ${item.name}</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: #10b981;"></div>
          </div>
          <span class="item-value" style="width: 40px;">${item.count}</span>
        </div>
      `;
    })
    .join("");

  // Order Type Totals
  const maxOrderTypeTotal = Math.max(...(analytics.orderTypeTotals || []).map((item: any) => item.total), 1);
  const orderTypeTotalsHTML = (analytics.orderTypeTotals || [])
    .map((item: any, idx: number) => {
      const percent = (item.total / maxOrderTypeTotal) * 100;
      const typeLabel = item.type ? translateOrderType(item.type) : t("reports.components.orderTypeTotals.unknown");
      return `
        <div class="item-row">
          <span class="item-label" style="width: 160px;">#${idx + 1} ${typeLabel} (${item.count})</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: #06b6d4;"></div>
          </div>
          <span class="item-value" style="width: 80px;">${Number(item.total).toFixed(2)}€</span>
        </div>
      `;
    })
    .join("");

  // Orders Table Rows
  const orders = analytics.orders || [];
  const orderTableRowsHTML = orders
    .map((order: any) => {
      const itemsText = order.items
        .map((it: any) => `${it.name} x${it.quantity}`)
        .join("<br/>");
      return `
        <tr>
          <td style="font-weight: 700; color: #000;">${configurations.orderPrefix || "K"}${order.orderId}</td>
          <td>
            <div style="font-weight: 600; color: #1e293b;">${order.customer?.name || "-"}</div>
            <div style="color: #64748b; font-size: 10px;">${order.customer?.phone || ""}</div>
          </td>
          <td>${itemsText}</td>
          <td><span class="status-pill" style="background-color: #f1f5f9; color: #475569;">${translateOrderStatus(order.status)}</span></td>
          <td>${formatDate(order.createdAt)}</td>
        </tr>
      `;
    })
    .join("");

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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 30px;
          }
          .header {
            display: block;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
          }
          .header h2 {
            margin: 6px 0 15px 0;
            font-size: 14px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #f1f5f9;
            padding-top: 12px;
            text-align: left;
          }
          .header-info p {
            margin: 4px 0;
            font-size: 11px;
            color: #64748b;
          }
          .grid-4 {
            display: flex;
            gap: 16px;
            margin-bottom: 25px;
          }
          .stat-card {
            flex: 1;
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          .stat-card .label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .stat-card .value {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
          }
          .stat-card .subtext {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
          }
          .grid-2 {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
          }
          .grid-2 .card {
            flex: 1;
            width: 50%;
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          .card h3 {
            margin: 0 0 16px 0;
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 8px;
            text-transform: uppercase;
          }
          .item-row {
            display: flex;
            align-items: center;
            margin: 10px 0;
          }
          .item-label {
            font-size: 11px;
            color: #334155;
            width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .progress-container {
            flex-grow: 1;
            background-color: #f1f5f9;
            height: 8px;
            border-radius: 4px;
            margin: 0 12px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            border-radius: 4px;
          }
          .item-value {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            width: 60px;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 12px;
            font-size: 11px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .status-pill {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 600;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("reports.title") || "Reports & Analytics"}</h1>
          <h2>${t("reports.tabs.orders") || "Orders"}</h2>
          <div class="header-info">
            <div>
              <p><strong>Company:</strong> ${configurations.name || ""}</p>
              ${configurations.vatNumber ? `<p><strong>${t("receipt.vat")}:</strong> ${configurations.vatNumber}</p>` : ""}
            </div>
            <div style="text-align: right;">
              <p><strong>Period:</strong> ${filterPeriod}</p>
              <p><strong>Print Date:</strong> ${dateTimeStr}</p>
            </div>
          </div>
        </div>

        <div class="grid-4">
          <div class="stat-card" style="border-left: 4px solid #3b82f6;">
            <div class="label">${t("reports.totalOrders")}</div>
            <div class="value">${analytics.totalOrders || 0}</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #10b981;">
            <div class="label">${t("reports.delivered")}</div>
            <div class="value">${(analytics.totalDelivered || 0) + (analytics.totalCompleted || 0)}</div>
            <div class="subtext">${analytics.successRate || 0}% ${t("reports.successRate")}</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #f97316;">
            <div class="label">${t("reports.avgDeliveryTime")}</div>
            <div class="value">${(analytics.avgDeliveryTime || 0).toFixed(2)} min</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #a855f7;">
            <div class="label">${t("reports.inProgress")}</div>
            <div class="value">${analytics.inProgress || 0}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.components.statusDistribution.title") || "Status Distribution"}</h3>
            ${statusRowsHTML || `<p style="color: #999;">${t("reports.components.statusDistribution.noOrders") || "No orders found"}</p>`}
          </div>
          <div class="card">
            <h3>${t("reports.components.hourlyDistribution.title") || "Hourly Distribution"}</h3>
            ${hourlyRowsHTML || `<p style="color: #999;">${t("reports.components.hourlyDistribution.noOrders") || "No orders found"}</p>`}
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.topOrderedItems") || "Top Ordered Items"}</h3>
            ${topItemsHTML || `<p style="color: #999;">No items found</p>`}
          </div>
          <div class="card">
            <h3>${t("reports.topOrderedMenus") || "Top Ordered Menus"}</h3>
            ${topMenusHTML || `<p style="color: #999;">No menus found</p>`}
          </div>
        </div>

        <div class="card" style="margin-bottom: 25px;">
          <h3>${t("reports.orderTypeTotals") || "Order Type Totals"}</h3>
          ${orderTypeTotalsHTML || `<p style="color: #999;">No order types found</p>`}
        </div>

        <div class="card">
          <h3>${t("reports.orderDetails") || "Order Details"}</h3>
          <table>
            <thead>
              <tr>
                <th>${t("reports.orderId")}</th>
                <th>${t("reports.customer")}</th>
                <th>${t("reports.items")}</th>
                <th>${t("reports.status")}</th>
                <th>${t("reports.time")}</th>
              </tr>
            </thead>
            <tbody>
              ${orderTableRowsHTML || `<tr><td colspan="5" style="text-align: center; padding: 20px;">No records found</td></tr>`}
            </tbody>
          </table>
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
