import { FilterType } from "@/types/order";
import { CustomSelect } from "../ui/CustomSelect";

import SearchIcon from "../../assets/icons/search.svg?react";

export const FilterControls: React.FC<{
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}> = ({ filter, setFilter }) => {
    const getStatusOptions = () => [
        { value: "all", label: "All Statuses" },
        { value: "sent to kitchen", label: "Sent to Kitchen" },
        { value: "ready for delivery", label: "Ready for Delivery" },
        { value: "out for delivery", label: "Out for Delivery" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];
    return (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400"/>
                </div>
                <input
                    type="text"
                    placeholder="Search orders..."
                    value={filter.searchTerm}
                    onChange={(e) =>
                        setFilter({ ...filter, searchTerm: e.target.value })
                    }
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <CustomSelect
                options={getStatusOptions()}
                value={filter.selectedStatus[0]}
                onChange={(value: string) =>
                    setFilter({ ...filter, selectedStatus: [value] })
                }
                placeholder="Select status"
                portalClassName="status-dropdown-portal"
            />
            <div className="relative">
                <input
                    type="date"
                    value={
                        filter.selectedDate
                            ? filter.selectedDate.toISOString().split("T")[0]
                            : ""
                    }
                    onChange={(e) =>
                        setFilter({
                            ...filter,
                            selectedDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                        })
                    }
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            {(filter.searchTerm ||
                filter.selectedDate ||
                filter.selectedStatus[0] !== "all") && (
                <button
                    onClick={() =>
                        setFilter({
                            searchTerm: "",
                            selectedDate: null,
                            selectedStatus: ["all"],
                        })
                    }
                    className="px-3 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
};
