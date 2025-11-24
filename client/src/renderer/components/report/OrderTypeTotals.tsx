import { useTranslation } from "react-i18next";
import { translateOrderType } from "../../utils/orderStatus";

export const OrderTypeTotals: React.FC<{
  orderTypeTotals: { type: string; total: number }[];
  title: string;
}> = ({ orderTypeTotals, title }) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const maxTotal = Math.max(...orderTypeTotals.map((item) => item.total), 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-black mb-4">{title}</h3>
      <div className="space-y-3">
        {orderTypeTotals.map((item, index) => (
          <div key={item.type} className="flex items-center">
            <span className="w-8 text-sm font-medium text-gray-600">
              #{index + 1}
            </span>
            <span className="flex-1 text-sm text-gray-700">
              {item.type
                ? translateOrderType(item.type)
                : t("reports.components.orderTypeTotals.unknown")}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
              <span className="w-24 text-sm font-bold text-black text-right">
                {formatCurrency(item.total)}
              </span>
            </div>
          </div>
        ))}
        {orderTypeTotals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t("reports.components.orderTypeTotals.noData")}
          </div>
        )}
      </div>
    </div>
  );
};
