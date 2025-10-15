import { DATE_RANGES } from "@/constants/report";
import { useTranslation } from "react-i18next";

export const DateRangeSelector: React.FC<{
  dateRange: string;
  setDateRange: (range: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}> = ({ dateRange, setDateRange, selectedDate, setSelectedDate }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("reports.components.dateRangeSelector.reportPeriod")}
          </label>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === range
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t(`reports.components.dateRangeSelector.periods.${range}`)}
              </button>
            ))}
          </div>
        </div>
        {dateRange === "custom" && (
          <div className="flex items-end">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        )}
      </div>
    </div>
  );
};
