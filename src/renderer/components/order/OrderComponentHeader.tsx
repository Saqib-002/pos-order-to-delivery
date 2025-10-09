import { useState } from "react";
import CustomerModal from "./modals/CustomerModal";
import { useOrder } from "@/renderer/contexts/OrderContext";
import { FilterType } from "@/types/order";
import { AddIcon, ChevronLeftIcon } from "@/renderer/assets/Svg";
import CustomButton from "../ui/CustomButton";

const OrderComponentHeader = ({
  refreshOrdersCallback,
  filter,
  setFilter,
}: {
  refreshOrdersCallback: () => void;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
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

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-2">
          {orderItems.length > 0 && (
            <CustomButton type="button" onClick={() => {clearOrder(); refreshOrdersCallback();}} Icon={<ChevronLeftIcon className="size-6"/>} className="!p-0" variant="transparent"/>
          )}
          <h1>Order</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              id="date-filter"
              type="date"
              value={formatDateForInput(filter.selectedDate)}
              onChange={handleDateChange}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <CustomButton type="button" onClick={() => setIsCustomerModalOpen(true)} Icon={<AddIcon className="size-6"/>} className="!p-0" variant="transparent"/>
        </div>
      </div>
      {isCustomerModalOpen && (
        <CustomerModal setIsOpen={setIsCustomerModalOpen} />
      )}
    </>
  );
};

export default OrderComponentHeader;
