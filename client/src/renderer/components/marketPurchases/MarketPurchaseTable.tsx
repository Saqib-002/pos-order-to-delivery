import { MarketPurchase } from "@/types/marketPurchases";
import { EditIcon, DeleteIcon } from "@/renderer/public/Svg";
import { useTranslation } from "react-i18next";

interface Props {
  purchases: MarketPurchase[];
  onEdit: (purchase: MarketPurchase) => void;
  onDelete: (id: string) => void;
}

export const MarketPurchaseTable = ({ purchases, onEdit, onDelete }: Props) => {
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
              {t("marketPurchaseManagement.table.ticketNumber")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("marketPurchaseManagement.table.supplier")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("marketPurchaseManagement.table.expenseType")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("marketPurchaseManagement.table.ticketDate")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("marketPurchaseManagement.table.paymentType")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              {t("marketPurchaseManagement.table.totalAmount")}
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
              {t("marketPurchaseManagement.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                {t("marketPurchaseManagement.table.noPurchases")}
              </td>
            </tr>
          ) : (
            purchases.map((purchase) => (
              <tr
                key={purchase.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {purchase.ticketNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {purchase.supplierName || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {purchase.expenseTypeName || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(purchase.ticketDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {purchase.paymentType && purchase.paymentType.includes(":")
                    ? purchase.paymentType
                    : purchase.paymentType.charAt(0).toUpperCase() +
                      purchase.paymentType.slice(1)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                  {formatCurrency(purchase.totalAmount)}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(purchase)}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                    title={t("common.edit")}
                  >
                    <EditIcon className="size-5" />
                  </button>
                  <button
                    onClick={() => onDelete(purchase.id!)}
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
