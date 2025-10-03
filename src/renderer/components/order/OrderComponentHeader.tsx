import { useState } from "react";
import AddIcon from "../../assets/icons/add.svg?react";
import CustomerModal from "./modals/CustomerModal";

const OrderComponentHeader = () => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  return (
    <>
      <div className="flex justify-between items-center px-4 py-2">
        <h1>Order</h1>
        <div>
          <button type="button" onClick={() => setIsCustomerModalOpen(true)}>
            <AddIcon className="fill-current text-black size-6 cursor-pointer hover:text-indigo-500 transition-colors duration-300" />
          </button>
        </div>
      </div>
      {isCustomerModalOpen && (
        <CustomerModal setIsOpen={setIsCustomerModalOpen}/>
      )}
    </>
  );
};

export default OrderComponentHeader;
