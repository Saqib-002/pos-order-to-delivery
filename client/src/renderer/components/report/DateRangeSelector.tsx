import { DATE_RANGES } from "@/constants/report";
import { useTranslation } from "react-i18next";
import { DateRangePicker } from "../ui/DateRangePicker";

export const DateRangeSelector: React.FC<{
  dateRange: string;
  setDateRange: (range: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  startDateRange?: Date | null;
  endDateRange?: Date | null;
  setStartDateRange?: (date: Date | null) => void;
  setEndDateRange?: (date: Date | null) => void;
}> = ({
  dateRange,
  setDateRange,
  selectedDate,
  setSelectedDate,
  startDateRange,
  endDateRange,
  setStartDateRange,
  setEndDateRange,
}) => {
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
                onClick={() => {
                  setDateRange(range);
                  if (
                    range !== "custom" &&
                    setStartDateRange &&
                    setEndDateRange
                  ) {
                    setStartDateRange(null);
                    setEndDateRange(null);
                  }
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === range
                    ? "bg-black text-white"
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
            <DateRangePicker
              startDate={startDateRange || null}
              endDate={endDateRange || null}
              selectedDate={selectedDate ? new Date(selectedDate) : null}
              onChange={(startDate, endDate) => {
                if (setStartDateRange && setEndDateRange) {
                  setStartDateRange(startDate);
                  setEndDateRange(endDate);
                }
                if (startDate) {
                  setSelectedDate(startDate.toISOString().split("T")[0]);
                } else {
                  setSelectedDate("");
                }
              }}
              className="w-48"
            />
          </div>
        )}
      </div>
    </div>
  );
};
