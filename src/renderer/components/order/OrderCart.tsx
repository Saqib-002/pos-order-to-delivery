import { OrderItem } from "@/types/order";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import PrinterIcon from "../../assets/icons/printer.svg?react";
import TrashIcon from "../../assets/icons/trash.svg?react";
import { calculateOrderTotal, calculateTaxPercentage } from "@/renderer/utils/orderCalculations";
import { useConfirm } from "@/renderer/hooks/useConfirm";

interface OrderCartProps {
  token: string | null;
  orderId: string;
  orderItems: OrderItem[];
  onRemoveItem: (itemId: string | undefined) => void;
  onUpdateQuantity: (itemId: string | undefined, quantity: number) => void;
  onClearOrder: () => void;
  onProcessOrder: () => void;
}

const OrderCart: React.FC<OrderCartProps> = ({
  token,
  orderId,
  orderItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearOrder,
  onProcessOrder,
}) => {
  const [isPrinterDropdownOpen, setIsPrinterDropdownOpen] = useState(false);
  const printerDropdownRef = useRef<HTMLDivElement>(null);
  const {orderTotal, nonMenuItems, groups}=calculateOrderTotal(orderItems);
  const confirm=useConfirm();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        printerDropdownRef.current &&
        !printerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPrinterDropdownOpen(false);
      }
    };

    if (isPrinterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPrinterDropdownOpen]);

  const handlePrinterClick = () => {
    setIsPrinterDropdownOpen(!isPrinterDropdownOpen);
  };

  const handlePrintCustomer = () => {
    // TODO: Implement customer print functionality
    toast.info("Printing customer receipt...");
    setIsPrinterDropdownOpen(false);
  };

  const handlePrintKitchen = () => {
    // TODO: Implement kitchen print functionality
    toast.info("Printing kitchen order...");
    setIsPrinterDropdownOpen(false);
  };

  const handleRemoveItem = async (itemId: string,itemName:string) => {
    const ok = await confirm({
      title: "Remove Item",
      message: "Are you sure you want to remove this item from your order?",
      type: "danger",
      confirmText: "Remove Item",
      cancelText: "Cancel",
      itemName: itemName,
    });
    if(!ok){
      return;
    }
    const res = await (window as any).electronAPI.removeItemFromOrder(
      token,
      orderId,
      itemId
    );
    if (!res.status) {
      toast.error(`Error removing item`);
      return;
    }
    onRemoveItem(itemId);
  };

  const handleRemoveGroup = async (group: any) => {
    const ok = await confirm({
      title: "Remove Menu",
      message: "Are you sure you want to remove this menu from your order?",
      type: "danger",
      confirmText: "Clear Order",
      cancelText: "Cancel",
      itemName: group.menuName,
    });
    if(!ok){
      return;
    }
    const res = await (window as any).electronAPI.removeMenuFromOrder(
      token,
      orderId,
      group.menuId,
      group.secondaryId
    );
    if (!res.status) {
      toast.error(`Error removing item`);
      return;
    }
    group.items.forEach((item: any) => onRemoveItem(item.id));
  };

  const handleUpdateGroupQuantity = async (group: any, quantity: number) => {
    const res = await (window as any).electronAPI.updateMenuQuantity(
      token,
      orderId,
      group.menuId,
      group.secondaryId,
      quantity
    );
    if (!res.status) {
      toast.error(`Error updating quantity`);
      return;
    }
    group.items.forEach((item: any) => onUpdateQuantity(item.id, quantity));
  };

  const handleClearOrder = async () => {
    const ok = await confirm({
      title: "Clear Order",
      message: "Are you sure you want to clear the entire order? This action cannot be undone.",
      type: "danger",
      confirmText: "Clear Order",
      cancelText: "Cancel",
    });
    if(!ok){
      return;
    }
    const res = await (window as any).electronAPI.deleteOrder(token, orderId);
    if (!res.status) {
      toast.error(`Error clearing order`);
      return;
    }
    onClearOrder();
  };

  const handleUpdateQuantity = async (
    itemId: string | undefined,
    quantity: number
  ) => {
    const res = await (window as any).electronAPI.updateItemQuantity(
      token,
      itemId,
      quantity
    );
    if (!res.status) {
      toast.error(`Error updating quantity`);
      return;
    }
    onUpdateQuantity(itemId, quantity);
  };

  if (orderItems.length === 0) {
    return (
      <div className="p-4 h-[calc(100vh-9rem)]">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-lg font-medium">Your Order</p>
          <p className="text-sm">
            Select items from the menu to add to your order
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-[calc(100vh-5.2rem)] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Your Order</h2>
        <div className="flex items-center gap-1">
          {/* Printer Dropdown */}
          <div className="relative" ref={printerDropdownRef}>
            <button
              onClick={handlePrinterClick}
              className="p-2 text-gray-600 rounded-lg transition-colors touch-manipulation cursor-pointer"
              title="Print Options"
            >
              <PrinterIcon className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isPrinterDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={handlePrintCustomer}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg touch-manipulation cursor-pointer"
                >
                  Customer
                </button>
                <button
                  onClick={handlePrintKitchen}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg touch-manipulation cursor-pointer"
                >
                  Kitchen
                </button>
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearOrder}
            className="p-2 text-red-600 rounded-lg transition-colors touch-manipulation cursor-pointer"
            title="Clear Order"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {/* Non-Menu Items */}
        {nonMenuItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">
                  {item.productName}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Product</span>
                    <span>€{item.productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>
                      Tax (
                      {calculateTaxPercentage(
                        item.productPrice,
                        item.productTax
                      )}
                      %)
                    </span>
                    <span>€{item.productTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variant: {item.variantName}</span>
                    <span>€{item.variantPrice.toFixed(2)}</span>
                  </div>
                </div>
                {item.complements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium">
                      Add-ons:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.complements.map((complement, index) => (
                        <li key={index} className="flex justify-between">
                          <span>• {complement.itemName}</span>
                          <span>€{complement.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  handleRemoveItem(item.id || "", item.productName)
                }
                className="text-red-500 hover:text-red-700 text-sm ml-2 touch-manipulation cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      item.id,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity + 1)
                  }
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-gray-800">
                €{(item.totalPrice*item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {/* Menu Groups */}
        {groups.map((group) => {
          const sectionQuantity = group.items[0]?.quantity || 1;
          const sectionSubtotal = group.basePrice * sectionQuantity;
          const sectionTaxTotal = group.taxPerUnit * sectionQuantity;
          const sectionSupplementTotal =
            group.supplementTotal * sectionQuantity;
          const sectionTotal =
            sectionSubtotal + sectionTaxTotal + sectionSupplementTotal;
          return (
            <div
              key={group.key}
              className="bg-white border border-gray-200 rounded-lg mb-3"
            >
              <div className="p-3 bg-gray-50 rounded-t-lg">
                {/* Header: Title and Total Price with Cross Icon */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">
                    From {group.menuName} - {group.secondaryId}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleRemoveGroup(
                          group
                        )
                      }
                      className="bg-red-500 text-white rounded-full p-1 text-sm touch-manipulation cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Menu Price</span>
                    <span>€{group.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Menu Tax (
                      {calculateTaxPercentage(
                        group.basePrice,
                        group.taxPerUnit
                      )}
                      %)
                    </span>
                    <span>€{group.taxPerUnit.toFixed(2)}</span>
                  </div>
                  {group.supplementTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Supplements</span>
                      <span>€{group.supplementTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-semibold text-gray-800">
                      €{sectionTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() =>
                      handleUpdateGroupQuantity(
                        group,
                        Math.max(1, sectionQuantity - 1)
                      )
                    }
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {sectionQuantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateGroupQuantity(group, sectionQuantity + 1)
                    }
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="border-t border-gray-200 pt-3">
                    <div className="flex justify-start items-start mb-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800">
                            {item.productName}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              {item.menuPageName}
                            </span>
                            {item.supplement && Number(item.supplement) > 0 && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                +€{item.supplement.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {/* <div className="flex justify-between">
                            <span>Base Product</span>
                            <span>€{item.productPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Tax</span>
                            <span>€{item.productTax.toFixed(2)}</span>
                          </div> */}
                          <div className="flex justify-between">
                            <span>Variant: {item.variantName}</span>
                            {/* <span>€{item.variantPrice.toFixed(2)}</span> */}
                          </div>
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 font-medium">
                              Add-ons:
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {item.complements.map((complement, index) => (
                                <li
                                  key={index}
                                  className="flex justify-between"
                                >
                                  <span>• {complement.itemName}</span>
                                  {/* <span>€{complement.price.toFixed(2)}</span> */}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 px-4">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total:</span>
          <span className="text-indigo-600">
            €{orderTotal.toFixed(2)}
          </span>
        </div>

        <button
          onClick={onProcessOrder}
          className="w-full bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors"
        >
          Process Order
        </button>
      </div>
    </div>
  );
};

export default OrderCart;
