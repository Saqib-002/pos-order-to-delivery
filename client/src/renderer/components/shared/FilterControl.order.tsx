import { FilterType } from "@/types/order";
import { useTranslation } from "react-i18next";
import SearchIcon from "../../assets/icons/search.svg?react";
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
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <input
        type="date"
        value={
          filter.selectedDate
            ? filter.selectedDate.toISOString().split("T")[0]
            : ""
        }
        onChange={(e) => {
          console.log(new Date(e.target.value));
          setFilter({
            ...filter,
            selectedDate: e.target.value ? new Date(e.target.value) : null,
          });
        }}
        className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
      {(filter.searchTerm || filter.selectedDate) && (
        <button
          onClick={() =>
            setFilter({ ...filter, searchTerm: "", selectedDate: null })
          }
          className="px-4 py-2 text-sm text-gray-600 hover:text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          {t("filterControls.clearFilters")}
        </button>
      )}
    </div>
  );
};
