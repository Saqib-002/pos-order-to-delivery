import { SearchIcon } from "@/renderer/public/Svg";
import { FilterType } from "@/types/order";
import { useTranslation } from "react-i18next";
import { DateRangePicker } from "../ui/DateRangePicker";
interface FilterControlsProps {
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  setFilter,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
      <div className="relative flex-1 sm:flex-none sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="text-gray-400 size-5" />
        </div>
        <input
          type="text"
          placeholder={t("filterControls.searchPlaceholder")}
          value={filter.searchTerm}
          onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
        />
      </div>
      <DateRangePicker
        startDate={filter.startDateRange}
        endDate={filter.endDateRange}
        selectedDate={filter.selectedDate}
        onChange={(startDate, endDate) => {
          setFilter({
            ...filter,
            startDateRange: startDate,
            endDateRange: endDate,
            selectedDate: startDate,
            page: 0,
          });
        }}
        className="w-48"
      />
      {(filter.searchTerm ||
        filter.selectedDate ||
        filter.startDateRange ||
        filter.endDateRange) && (
        <button
          onClick={() =>
            setFilter({
              ...filter,
              searchTerm: "",
              selectedDate: null,
              startDateRange: null,
              endDateRange: null,
            })
          }
          className="px-4 py-2 text-sm text-gray-600 hover:text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          {t("filterControls.clearFilters")}
        </button>
      )}
    </div>
  );
};
