import { Vehicle, VehicleMaintenance } from "@/types/vehicles";
import { Worker, WorkerSalary } from "@/types/workers";
import { calculatePaymentStatus, getPaymentStatusStyle } from "./paymentStatus";

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

export const generateMaintenanceReportHTML = (
  vehicle: Vehicle,
  records: VehicleMaintenance[],
  filters: { startDate?: string; endDate?: string },
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

  const totalAmount = records.reduce(
    (sum, record) => sum + (Number(record.total) || 0),
    0
  );

  const totalPaid = records.reduce((sum, record) => {
    if (record.paymentType) {
      const recordTotal = Number(record.total) || 0;
      const paymentStatus = calculatePaymentStatus(
        record.paymentType || "",
        recordTotal
      );
      if (paymentStatus.status === "PAID") {
        return sum + recordTotal;
      } else if (paymentStatus.status === "PARTIAL") {
        const payments = record.paymentType.split(", ");
        const paidAmount = payments.reduce((acc, payment) => {
          const [, amount] = payment.split(":");
          return acc + (parseFloat(amount) || 0);
        }, 0);
        return sum + paidAmount;
      }
    }
    return sum;
  }, 0);

  const recordsHTML = records
    .map((record) => {
      const paymentStatus = calculatePaymentStatus(
        record.paymentType || "",
        Number(record.total) || 0
      );
      return `
        <tr>
          <td>${formatDate(record.date)}</td>
          <td>${record.sparePart}</td>
          <td style="text-align: center;">${record.unit}</td>
          <td style="text-align: right;">${Number(record.price).toFixed(2)}€</td>
          <td style="text-align: right;">${Number(record.total).toFixed(2)}€</td>
          <td style="text-align: right;">${record.currentMileage ? `${record.currentMileage.toLocaleString()} km` : "-"}</td>
          <td style="text-align: center;">
            <span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; ${getPaymentStatusStyle(paymentStatus.status)}">
              ${paymentStatus.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return generatePDFReportHTML({
    title: t("vehicleManagement.maintenanceModal.reportTitle"),
    entityInfo: [
      {
        label: t("vehicleManagement.maintenanceModal.vehicleInfo"),
        value: "",
      },
      {
        label: t("vehicleManagement.modal.model"),
        value: vehicle.model,
      },
      {
        label: t("vehicleManagement.modal.licensePlate"),
        value: vehicle.licensePlate,
      },
      ...(vehicle.color
        ? [
            {
              label: t("vehicleManagement.modal.color"),
              value: vehicle.color,
            },
          ]
        : []),
      ...(vehicle.type
        ? [
            {
              label: t("vehicleManagement.modal.type"),
              value: t(`vehicleManagement.filters.${vehicle.type}`),
            },
          ]
        : []),
    ],
    reportInfo: [
      ...(filters.startDate && filters.endDate
        ? [
            {
              label: t("vehicleManagement.maintenanceModal.dateRange"),
              value: `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
            },
          ]
        : []),
      {
        label: t("vehicleManagement.maintenanceModal.totalRecords"),
        value: String(records.length),
      },
    ],
    tableHeaders: [
      t("vehicleManagement.maintenanceModal.table.date"),
      t("vehicleManagement.maintenanceModal.table.servicePart"),
      t("vehicleManagement.maintenanceModal.table.unit"),
      t("vehicleManagement.maintenanceModal.table.price"),
      t("vehicleManagement.maintenanceModal.table.total"),
      t("vehicleManagement.maintenanceModal.table.currentMileage"),
      t("vehicleManagement.maintenanceModal.table.paymentStatus"),
    ],
    tableRows: recordsHTML,
    summary: [
      {
        label: t("vehicleManagement.maintenanceModal.totalAmount"),
        value: `${Number(totalAmount || 0).toFixed(2)}€`,
      },
      {
        label: t("vehicleManagement.maintenanceModal.totalPaid"),
        value: `${Number(totalPaid || 0).toFixed(2)}€`,
      },
      {
        label: t("vehicleManagement.maintenanceModal.totalPending"),
        value: `${Number((totalAmount || 0) - (totalPaid || 0)).toFixed(2)}€`,
      },
    ],
    configurations,
    t,
  });
};

export const generateSalaryReportHTML = async (
  worker: Worker,
  records: WorkerSalary[],
  salaryPayments: { [salaryId: string]: any[] },
  filters: { startDate?: string; endDate?: string },
  configurations: { name?: string; address?: string; vatNumber?: string },
  t: (key: string) => string
): Promise<string> => {
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

  const formatDateTime = (dateString: string | Date | undefined) => {
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
      }) + " " + date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateString);
    }
  };

  const totalAmount = records.reduce(
    (sum, record) => sum + (Number(record.total) || 0),
    0
  );

  const totalPaid = records.reduce((sum, record) => {
    return sum + (Number(record.totalPaid) || 0);
  }, 0);

  const recordsHTML = records
    .map((record) => {
      const total = Number(record.total) || 0;
      const totalPaid = Number(record.totalPaid) || 0;

      let status: "PAID" | "UNPAID" | "PARTIAL";
      if (totalPaid <= 0) {
        status = "UNPAID";
      } else if (totalPaid >= total) {
        status = "PAID";
      } else {
        status = "PARTIAL";
      }

      const transactions = salaryPayments[record.id] || [];
      const transactionsHTML =
        transactions.length > 0
          ? transactions
              .map(
                (transaction: any) => `
          <tr style="background-color: #f9f9f9;">
            <td style="padding-left: 20px; font-size: 9px; color: #666;">
              ${transaction.paymentMethod}
            </td>
            <td style="text-align: right; font-size: 9px; color: #666;">${Number(transaction.amount).toFixed(2)}€</td>
            <td colspan="7" style="font-size: 9px; color: #666;">
              ${formatDateTime(transaction.paymentDate || transaction.createdAt)}
            </td>
            <td></td>
          </tr>
        `
              )
              .join("")
          : `<tr style="background-color: #f9f9f9;">
          <td colspan="10" style="text-align: center; font-size: 9px; color: #999; font-style: italic;">
            ${t("workerManagement.salaryModal.noTransactions")}
          </td>
        </tr>`;

      return `
      <tr>
        <td>${formatDate(record.date)}</td>
        <td style="text-align: right;">${Number(record.base).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.socialSecurityCompany).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.socialSecurityWorker).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.irpf).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.extraPayment).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.bonus).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.extraServices).toFixed(2)}€</td>
        <td style="text-align: right;">${Number(record.total).toFixed(2)}€</td>
        <td style="text-align: center;">
          <span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; ${getPaymentStatusStyle(status)}">
            ${status}
          </span>
        </td>
      </tr>
      ${transactionsHTML}
    `;
    })
    .join("");

  return generatePDFReportHTML({
    title: t("workerManagement.salaryModal.reportTitle"),
    entityInfo: [
      {
        label: t("workerManagement.salaryModal.workerInfo"),
        value: "",
      },
      {
        label: t("workerManagement.modal.name"),
        value: worker.name,
      },
      ...(worker.idNumber
        ? [
            {
              label: t("workerManagement.modal.idNumber"),
              value: worker.idNumber,
            },
          ]
        : []),
      ...(worker.phoneNumber
        ? [
            {
              label: t("workerManagement.modal.phoneNumber"),
              value: worker.phoneNumber,
            },
          ]
        : []),
    ],
    reportInfo: [
      ...(filters.startDate && filters.endDate
        ? [
            {
              label: t("workerManagement.salaryModal.dateRange"),
              value: `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
            },
          ]
        : []),
      {
        label: t("workerManagement.salaryModal.totalRecords"),
        value: String(records.length),
      },
    ],
    tableHeaders: [
      t("workerManagement.salaryModal.table.date"),
      t("workerManagement.salaryModal.table.base"),
      t("workerManagement.salaryModal.table.socialSecurityCompany"),
      t("workerManagement.salaryModal.table.socialSecurityWorker"),
      t("workerManagement.salaryModal.table.irpf"),
      t("workerManagement.salaryModal.table.extraPayment"),
      t("workerManagement.salaryModal.table.bonus"),
      t("workerManagement.salaryModal.table.extraServices"),
      t("workerManagement.salaryModal.table.total"),
      t("workerManagement.salaryModal.table.paymentStatus"),
    ],
    tableRows: recordsHTML,
    summary: [
      {
        label: t("workerManagement.salaryModal.totalAmount"),
        value: `${Number(totalAmount || 0).toFixed(2)}€`,
      },
      {
        label: t("workerManagement.salaryModal.totalPaid"),
        value: `${Number(totalPaid || 0).toFixed(2)}€`,
      },
      {
        label: t("workerManagement.salaryModal.totalPending"),
        value: `${Number((totalAmount || 0) - (totalPaid || 0)).toFixed(2)}€`,
      },
    ],
    configurations,
    t,
  });
};
