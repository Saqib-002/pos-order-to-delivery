import { useState } from "react";
import AddIcon from "../../assets/icons/add.svg?react";
import SuspendIcon from "../../assets/icons/suspend.svg?react";
import CustomerModal from "./modals/CustomerModal";
import { useOrder } from "@/renderer/contexts/OrderContext";
import ChevronLeftIcon from "../../assets/icons/chevron-left.svg?react";

const OrderComponentHeader = ({
  refreshOrdersCallback,
}: {
  refreshOrdersCallback: () => void;
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const { clearOrder, orderItems } = useOrder();
  return (
    <>
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-2">
          {orderItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                refreshOrdersCallback();
                clearOrder();
              }}
              className="text-gray-700 cursor-pointer hover:text-indigo-500 transition-colors duration-300"
            >
              <ChevronLeftIcon className="w-6 h-6 stroke-current" />
            </button>
          )}
          <h1>Order</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsCustomerModalOpen(true)}>
            <AddIcon className="fill-current text-black size-6 cursor-pointer hover:text-indigo-500 transition-colors duration-300" />
          </button>
          <button
            type="button"
            onClick={() => {
              /* TODO: Implement suspend functionality */
            }}
          >
            <SuspendIcon className="w-6 h-6 cursor-pointer" />
          </button>
        </div>
      </div>
      {isCustomerModalOpen && (
        <CustomerModal setIsOpen={setIsCustomerModalOpen} />
      )}
    </>
  );
};

export default OrderComponentHeader;
