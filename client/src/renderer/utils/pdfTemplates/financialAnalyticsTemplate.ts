export const generateFinancialAnalyticsReportHTML = (
  data: any,
  filters: {
    dateRange: string;
    selectedDate?: string;
    startDateRange?: Date | null;
    endDateRange?: Date | null;
  },
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

  const renderDistributionRows = (items: any[] = [], totalRef: number, color: string) => {
    if (!items.length) return `<p style="color: #94a3b8; text-align: center; padding: 10px;">${t("common.noData")}</p>`;
    return items
      .map((item) => {
        const percentage = totalRef ? ((item.total / totalRef) * 100) : 0;
        let pendingText = "";
        if (item.pending > 0) {
          pendingText = `<span style="font-size: 9px; color: #b91c1c; margin-left: 5px; font-weight: normal;">(Pending: ${Number(item.pending).toFixed(2)}€)</span>`;
        }
        return `
          <div class="item-row">
            <span class="item-label">${item.name || "-"}</span>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
            <span class="item-value">${Number(item.total).toFixed(2)}€${pendingText}</span>
          </div>
        `;
      })
      .join("");
  };

  const breakdowns = data.breakdowns || {};

  const renderSectionSummary = (items: any[] = []) => {
    const totals = items.reduce(
      (acc, item) => ({
        total: acc.total + (Number(item.total) || 0),
        pending: acc.pending + (Number(item.pending) || 0),
      }),
      { total: 0, pending: 0 }
    );
    let pendingHTML = "";
    if (totals.pending > 0) {
      pendingHTML = `
        <div style="text-align: right;">
          <span style="font-size: 8px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${t("common.paymentStatus.pending") || "Pending"}</span>
          <span style="font-size: 12px; font-weight: 700; color: #b45309;">${totals.pending.toFixed(2)}€</span>
        </div>
      `;
    }
    return `
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${t("reports.financial.total") || "Total"}</span>
          <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${totals.total.toFixed(2)}€</span>
        </div>
        ${pendingHTML}
      </div>
    `;
  };

  const income = breakdowns.paymentMethods?.income || {};
  const expenses = breakdowns.paymentMethods?.expenses || {};
  const cashOuts = breakdowns.paymentMethods?.cashOuts || {};
  
  const allMethods = Array.from(new Set([
    ...Object.keys(income),
    ...Object.keys(expenses),
    ...Object.keys(cashOuts)
  ]));
  
  const netBalances = allMethods
    .map(method => ({
      method,
      amount: (Number(income[method]) || 0) - (Number(expenses[method]) || 0) - (Number(cashOuts[method]) || 0)
    }))
    .filter(item => item.amount !== 0)
    .sort((a, b) => b.amount - a.amount);

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
            width: 25%;
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
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
            box-sizing: border-box;
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
            width: 100px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
          }
          .progress-container {
            flex-grow: 1;
            background-color: #f1f5f9;
            height: 10px;
            border-radius: 5px;
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
            width: 70px;
            text-align: right;
            flex-shrink: 0;
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
          <h2>${t("reports.tabs.financial") || "Financial"}</h2>
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
          <div class="stat-card" style="border-left: 4px solid #10b981;">
            <div class="label">${t("reports.financial.totalIncome")}</div>
            <div class="value" style="color: #10b981;">${(data.summary.income || 0).toFixed(2)}€</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #ef4444;">
            <div class="label">${t("reports.financial.totalExpenses")}</div>
            <div class="value" style="color: #ef4444;">${(data.summary.totalExpenses || 0).toFixed(2)}€</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #3b82f6;">
            <div class="label">${t("reports.financial.netProfit")}</div>
            <div class="value" style="color: #3b82f6;">${(data.summary.netProfit || 0).toFixed(2)}€</div>
          </div>
          <div class="stat-card" style="border-left: 4px solid #f59e0b;">
            <div class="label">${t("reports.financial.cashIncome")}</div>
            <div class="value" style="color: #f59e0b;">${(breakdowns?.paymentMethods?.income?.cash || 0).toFixed(2)}€</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.financial.cashInOut") || "Cash In / Out"}</h3>
            ${(() => {
              const totalMovements = (data.summary.breakdown.cashOutTotal || 0) + (data.summary.breakdown.cashInTotal || 0);
              return (breakdowns.cashOuts || [])
                .map((item: any) => {
                  const percentage = totalMovements ? ((item.total / totalMovements) * 100) : 0;
                  const isInflow = item.transactionType === "in";
                  const barColor = isInflow ? "#10b981" : "#ef4444";
                  const sign = isInflow ? "+" : "-";
                  return `
                    <div class="item-row">
                      <span class="item-label">${item.name || "-"}</span>
                      <div class="progress-container">
                        <div class="progress-bar" style="width: ${percentage}%; background-color: ${barColor};"></div>
                      </div>
                      <span class="item-value" style="color: ${barColor}; font-weight: bold;">${sign}${Number(item.total).toFixed(2)}€</span>
                    </div>
                  `;
                })
                .join("");
            })()}
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${t("reports.financial.cashIn") || "Cash In"}</span>
                <span style="font-size: 12px; font-weight: 700; color: #10b981;">+${(data.summary.breakdown.cashInTotal || 0).toFixed(2)}€</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${t("reports.financial.cashOut") || "Cash Out"}</span>
                <span style="font-size: 12px; font-weight: 700; color: #ef4444;">-${(data.summary.breakdown.cashOutTotal || 0).toFixed(2)}€</span>
              </div>
            </div>
          </div>
          <div class="card">
            <h3>${t("reports.financial.incomeBySource")}</h3>
            ${renderDistributionRows(breakdowns.otherIncomeBySource, data.summary.income || 1, "#10b981")}
            ${renderSectionSummary(breakdowns.otherIncomeBySource)}
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.financial.expensesByCategory")}</h3>
            ${renderDistributionRows(breakdowns.marketPurchasesByType, data.summary.breakdown.marketExpenses || 1, "#008080")}
            ${renderSectionSummary(breakdowns.marketPurchasesByType)}
          </div>
          <div class="card">
            <h3>${t("reports.financial.topSuppliers")}</h3>
            ${renderDistributionRows(breakdowns.marketPurchasesBySupplier, data.summary.breakdown.marketExpenses || 1, "#3b82f6")}
            ${renderSectionSummary(breakdowns.marketPurchasesBySupplier)}
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.financial.topWorkers")}</h3>
            ${renderDistributionRows(breakdowns.salariesByWorker, data.summary.breakdown.workerExpenses || 1, "#f43f5e")}
            ${renderSectionSummary(breakdowns.salariesByWorker)}
          </div>
          <div class="card">
            <h3>${t("reports.financial.maintenanceByVehicle")}</h3>
            ${renderDistributionRows(breakdowns.maintenanceByVehicle, data.summary.breakdown.vehicleExpenses || 1, "#0ea5e9")}
            ${renderSectionSummary(breakdowns.maintenanceByVehicle)}
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>${t("reports.financial.purchasesByProduct")}</h3>
            ${renderDistributionRows(breakdowns.purchasesByProduct, data.summary.breakdown.marketExpenses || 1, "#a855f7")}
            ${renderSectionSummary(breakdowns.purchasesByProduct)}
          </div>
          <div class="card">
            <h3>${t("reports.financial.paymentOverview")}</h3>
            <div style="font-weight: bold; font-size: 10px; margin-bottom: 8px; color: #64748b; text-transform: uppercase;">${t("reports.financial.income")}</div>
            ${Object.entries(breakdowns.paymentMethods?.income || {}).map(([method, amount]: any) => amount > 0 ? `
              <div class="item-row">
                <span class="item-label">${method}</span>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${data.summary.totalIncome ? (amount / data.summary.totalIncome) * 100 : 0}%; background-color: #6366f1;"></div>
                </div>
                <span class="item-value">${Number(amount).toFixed(2)}€</span>
              </div>
            ` : "").join("")}
            <div style="font-weight: bold; font-size: 10px; margin-top: 15px; margin-bottom: 8px; color: #64748b; text-transform: uppercase;">${t("reports.financial.expenses")}</div>
            ${Object.entries(breakdowns.paymentMethods?.expenses || {}).map(([method, amount]: any) => amount > 0 ? `
              <div class="item-row">
                <span class="item-label">${method}</span>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${data.summary.totalExpenses ? (amount / data.summary.totalExpenses) * 100 : 0}%; background-color: #ef4444;"></div>
                </div>
                <span class="item-value">${Number(amount).toFixed(2)}€</span>
              </div>
            ` : "").join("")}
            <div style="font-weight: bold; font-size: 10px; margin-top: 15px; margin-bottom: 8px; color: #64748b; text-transform: uppercase;">${t("reports.financial.cashIn") || "Cash In"}</div>
            ${Object.entries(breakdowns.paymentMethods?.cashIns || {}).map(([method, amount]: any) => amount > 0 ? `
              <div class="item-row">
                <span class="item-label">${method}</span>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${data.summary.breakdown.cashInTotal ? (amount / data.summary.breakdown.cashInTotal) * 100 : 0}%; background-color: #10b981;"></div>
                </div>
                <span class="item-value">${Number(amount).toFixed(2)}€</span>
               </div>
            ` : "").join("")}
            <div style="font-weight: bold; font-size: 10px; margin-top: 15px; margin-bottom: 8px; color: #64748b; text-transform: uppercase;">${t("reports.financial.cashOut") || "Cash Out"}</div>
            ${Object.entries(breakdowns.paymentMethods?.cashOuts || {}).map(([method, amount]: any) => amount > 0 ? `
              <div class="item-row">
                <span class="item-label">${method}</span>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${data.summary.breakdown.cashOutTotal ? (amount / data.summary.breakdown.cashOutTotal) * 100 : 0}%; background-color: #f59e0b;"></div>
                </div>
                <span class="item-value">${Number(amount).toFixed(2)}€</span>
              </div>
            ` : "").join("")}
          </div>
        </div>

        <div class="grid-2">
          <div class="card" style="width: 100%;">
            <h3>${t("reports.financial.netBalance") || "Net Balance"}</h3>
            ${netBalances.map((item) => {
              const maxAmt = Math.max(...netBalances.map(b => Math.abs(b.amount)), 1);
              const percent = (Math.abs(item.amount) / maxAmt) * 100;
              const isPositive = item.amount >= 0;
              const barColor = isPositive ? "#10b981" : "#ef4444";
              const cleanMethod = item.method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              return `
                <div class="item-row">
                  <span class="item-label">${cleanMethod}</span>
                  <div class="progress-container">
                    <div class="progress-bar" style="width: ${percent}%; background-color: ${barColor};"></div>
                  </div>
                  <span class="item-value" style="color: ${barColor}; font-weight: bold;">
                    ${isPositive ? "+" : ""}${Number(item.amount).toFixed(2)}€
                  </span>
                </div>
              `;
            }).join("")}
            ${netBalances.length === 0 ? `<p style="color: #94a3b8; text-align: center; padding: 10px;">${t("common.noData")}</p>` : ""}
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <span style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${t("reports.financial.netProfit") || "Net Profit"}</span>
                <span style="font-size: 12px; font-weight: 700; color: ${data.summary.netProfit >= 0 ? "#10b981" : "#ef4444"};">${data.summary.netProfit.toFixed(2)}€</span>
              </div>
            </div>
          </div>
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
