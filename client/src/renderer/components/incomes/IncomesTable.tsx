import { Income } from "@/types/incomes";
import { EditIcon, DeleteIcon } from "@/renderer/public/Svg";
import { useTranslation } from "react-i18next";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "@/renderer/utils/paymentStatus";
import dayjs from "dayjs";

interface Props {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export const IncomeTable = ({ incomes, onEdit, onDelete }: Props) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      return dayjs(new Date(dateString).toLocaleDateString()).format("DD/MM/YYYY");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "€0.00";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "€0.00";
    return `€${numAmount.toFixed(2)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.date")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.name")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.description")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.ticketId")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.total")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.paymentType")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("incomesManagement.table.paymentStatus")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
              {t("incomesManagement.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {incomes.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                {t("incomesManagement.table.noOtherIncomes")}
              </td>
            </tr>
          ) : (
            incomes.map((income) => (
              <tr
                key={income.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {formatDate(income.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {income.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {income.description || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {income.ticketId || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                  {formatCurrency(income.total)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {income.paymentType && income.paymentType.includes(":")
                    ? income.paymentType
                    : income.paymentType.charAt(0).toUpperCase() +
                      income.paymentType.slice(1)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const total =
                      typeof income.total === "number"
                        ? income.total
                        : parseFloat(String(income.total || 0)) || 0;
                    const paymentStatus = calculatePaymentStatus(
                      income.paymentType || "",
                      total
                    );
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusStyle(paymentStatus.status)}`}
                      >
                        {t(
                          `common.paymentStatus.${paymentStatus.status.toLowerCase()}`
                        )}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(income)}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                    title={t("common.edit")}
                  >
                    <EditIcon className="size-5" />
                  </button>
                  <button
                    onClick={() => onDelete(income.id!)}
                    className="p-2 hover:bg-red-100 rounded-full text-red-600"
                    title={t("common.delete")}
                  >
                    <DeleteIcon className="size-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
