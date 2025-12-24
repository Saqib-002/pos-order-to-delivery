import { Expense } from "@/types/expenses";
import { EditIcon, DeleteIcon } from "@/renderer/public/Svg";
import { useTranslation } from "react-i18next";

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpensesTable = ({ expenses, onEdit, onDelete }: Props) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
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
              {t("expenseManagement.table.date")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("expenseManagement.table.name")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("expenseManagement.table.description")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("expenseManagement.table.total")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("expenseManagement.table.paymentType")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
              {t("expenseManagement.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                {t("expenseManagement.table.noExpenses")}
              </td>
            </tr>
          ) : (
            expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {formatDate(expense.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {expense.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {expense.description || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                  {formatCurrency(expense.total)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {expense.paymentType && expense.paymentType.includes(":")
                    ? expense.paymentType
                    : expense.paymentType.charAt(0).toUpperCase() +
                      expense.paymentType.slice(1)}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                    title={t("common.edit")}
                  >
                    <EditIcon className="size-5" />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id!)}
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
