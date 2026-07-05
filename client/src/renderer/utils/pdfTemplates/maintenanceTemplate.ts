import { Vehicle, VehicleMaintenance } from "@/types/vehicles";
import { calculatePaymentStatus, getPaymentStatusStyle } from "../paymentStatus";
import { generatePDFReportHTML } from "./baseReportTemplate";

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
