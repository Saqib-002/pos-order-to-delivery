import { Worker, WorkerSalary } from "@/types/workers";
import { getPaymentStatusStyle } from "../paymentStatus";
import { generatePDFReportHTML } from "./baseReportTemplate";

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
