interface PDFReportOptions {
  title: string;
  entityInfo: {
    label: string;
    value: string;
  }[];
  reportInfo: {
    label: string;
    value: string;
  }[];
  tableHeaders: string[];
  tableRows: string;
  summary?: {
    label: string;
    value: string;
  }[];
  configurations: {
    name?: string;
    address?: string;
    vatNumber?: string;
  };
  t: (key: string) => string;
}

export const generatePDFReportHTML = (options: PDFReportOptions): string => {
  const {
    title,
    entityInfo,
    reportInfo,
    tableHeaders,
    tableRows,
    summary,
    configurations,
    t,
  } = options;

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

  const entityInfoHTML = entityInfo
    .map((info, index) => {
      if (index === 0 && !info.value) {
        return `<h3>${info.label}</h3>`;
      }
      if (!info.value) return "";
      return `<p><strong>${info.label}:</strong> ${info.value}</p>`;
    })
    .filter((html) => html !== "")
    .join("");

  const reportInfoHTML = reportInfo
    .map(
      (info) => `<p><strong>${info.label}:</strong> ${info.value || "-"}</p>`
    )
    .join("");

  const summaryHTML = summary
    ? summary
      .map(
        (item) => `
            <div class="summary-row">
              <span class="summary-label">${item.label}:</span>
              <span class="summary-value">${item.value}</span>
            </div>
          `
      )
      .join("")
    : "";

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
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 12px;
          }
          .summary-label {
            font-weight: bold;
          }
          .summary-value {
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
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
          <h1>${title}</h1>
          <div class="header-info">
            <div>
              <div class="header-section">
                ${entityInfoHTML}
              </div>
            </div>
            <div>
              <div class="header-section">
                <h3>${t("vehicleManagement.maintenanceModal.reportInfo")}</h3>
                <p><strong>${t("receipt.date")}:</strong> ${dateTimeStr}</p>
                ${reportInfoHTML}
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="${tableHeaders.length}" style="text-align: center; padding: 20px;">${t("vehicleManagement.maintenanceModal.table.noRecordsFound")}</td></tr>`}
          </tbody>
        </table>

        ${summaryHTML ? `<div class="summary">${summaryHTML}</div>` : ""}

        <div class="footer">
          <p>${configurations.name || ""}</p>
          ${configurations.address ? `<p>${configurations.address}</p>` : ""}
          ${configurations.vatNumber ? `<p>${t("receipt.vat")}: ${configurations.vatNumber}</p>` : ""}
        </div>
      </body>
    </html>
  `;
};
