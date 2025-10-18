import { useState } from "react";
import { useOrder } from "@/renderer/contexts/OrderContext";
import { FilterType } from "@/types/order";
import { ChevronLeftIcon } from "@/renderer/assets/Svg";
import CustomButton from "../ui/CustomButton";
import { CustomSelect } from "../ui/CustomSelect";

const OrderComponentHeader = ({
  refreshOrdersCallback,
  filter,
  setFilter,
}: {
  refreshOrdersCallback: () => void;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}) => {
  const { clearOrder, orderItems } = useOrder();
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = event.target.value
      ? new Date(event.target.value)
      : null;
    setFilter((prev) => ({
      ...prev,
      selectedDate,
    }));
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleCombinedFilterChange = (value: string) => {
    if (value === "all") {
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [],
        selectedPaymentStatus: [],
      }));
    } else if (value.startsWith("status:")) {
      const status = value.replace("status:", "");
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [status],
        selectedPaymentStatus: [],
      }));
    } else if (value.startsWith("payment:")) {
      const paymentStatus = value.replace("payment:", "");
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [],
        selectedPaymentStatus: [paymentStatus],
      }));
    }
  };

  const combinedFilterOptions = [
    { value: "all", label: "All Orders" },
    { value: "status:pending", label: "📋 Pending" },
    { value: "status:sent to kitchen", label: "👨‍🍳 Sent to Kitchen" },
    { value: "status:ready for delivery", label: "✅ Ready for Delivery" },
    { value: "status:out for delivery", label: "🚚 Out for Delivery" },
    { value: "status:completed", label: "✅ Completed" },
    { value: "status:delivered", label: "📦 Delivered" },
    { value: "status:cancelled", label: "❌ Cancelled" },
    { value: "payment:PAID", label: "💚 Paid" },
    { value: "payment:UNPAID", label: "🔴 Unpaid" },
    { value: "payment:PARTIAL", label: "🟡 Partial Payment" },
  ];

  const getCurrentFilterValue = () => {
    if (
      filter.selectedStatus.length > 0 &&
      filter.selectedStatus[0] !== "all"
    ) {
      return `status:${filter.selectedStatus[0]}`;
    }
    if (
      filter.selectedPaymentStatus.length > 0 &&
      filter.selectedPaymentStatus[0] !== "all"
    ) {
      return `payment:${filter.selectedPaymentStatus[0]}`;
    }
    return "all";
  };

  return (
    <>
      <div className="flex justify-between items-center px-0 py-2">
        <div className="flex items-center gap-0">
          {orderItems.length > 0 && (
            <CustomButton
              type="button"
              onClick={() => {
                clearOrder();
                refreshOrdersCallback();
              }}
              Icon={<ChevronLeftIcon className="size-6" />}
              className="!p-0 !m-0"
              variant="transparent"
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <input
              id="date-filter"
              type="date"
              value={formatDateForInput(filter.selectedDate)}
              onChange={handleDateChange}
              className="px-3 py-3 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="w-46">
            <CustomSelect
              options={combinedFilterOptions}
              value={getCurrentFilterValue()}
              onChange={handleCombinedFilterChange}
              placeholder="Filter Orders"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderComponentHeader;
