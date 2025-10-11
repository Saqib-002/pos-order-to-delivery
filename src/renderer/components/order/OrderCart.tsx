import { OrderItem } from "@/types/order";
import React from "react";
import { toast } from "react-toastify";
import { calculateOrderTotal, calculateTaxPercentage } from "@/renderer/utils/orderCalculations";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import CustomButton from "../ui/CustomButton";
import { CrossIcon, DeleteIcon, EditIcon, PrinterIcon } from "@/renderer/assets/Svg";
import { useOrder } from "@/renderer/contexts/OrderContext";
import { generateReceiptHTML, groupItemsByPrinter } from "@/renderer/utils/printer";
import { useAuth } from "@/renderer/contexts/AuthContext";

interface OrderCartProps {
  orderId: string;
  orderItems: OrderItem[];
  onRemoveItem: (itemId: string | undefined) => void;
  onUpdateQuantity: (itemId: string | undefined, quantity: number) => void;
  onClearOrder: () => void;
  onProcessOrder: () => void;
}

const OrderCart: React.FC<OrderCartProps> = ({
  orderId,
  orderItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearOrder,
  onProcessOrder
}) => {
  const { orderTotal, nonMenuItems, groups } = calculateOrderTotal(orderItems);
  const { setSelectedMenu, setSelectedProduct, setEditingGroup, setEditingProduct,order, setMode } = useOrder();
  const confirm = useConfirm();
  const {auth:{user,token}}=useAuth();
  console.log(orderItems);
  const handlePrint = async () => {
    const printerGroups = groupItemsByPrinter(orderItems);
    if(!Object.keys(printerGroups).length){
      toast.warn("No printers attached");
      return;
    }
    toast.info("Printing customer receipt...");
    for (const [printerName, items] of Object.entries(printerGroups)) {
      const receiptHTML = generateReceiptHTML(items, order!.orderId,user!.role);
      const res = await (window as any).electronAPI.printToPrinter(token, printerName, { html: receiptHTML });
      if (!res.status) {
        if (res.error === "Printer not found") {
          toast.error(`Printer "${printerName}" not found`);
        } else {
          toast.error("Error printing receipt");
        }
        return;
      }
    }
    toast.success("Receipt printed successfully");
  };


  const handleRemoveItem = async (itemId: string, itemName: string) => {
    const ok = await confirm({
      title: "Remove Item",
      message: "Are you sure you want to remove this item from your order?",
      type: "danger",
      confirmText: "Remove Item",
      cancelText: "Cancel",
      itemName: itemName,
    });
    if (!ok) {
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
  const handleEditItem = async (item: any) => {
    const res = await (window as any).electronAPI.getProductById(token, item.productId);
    if (!res.status) {
      toast.error(`Error getting product`);
      return;
    }
    setMode("product");
    setEditingProduct(item);
    setSelectedProduct(res.data);
  }
  const handleRemoveGroup = async (group: any) => {
    const ok = await confirm({
      title: "Remove Menu",
      message: "Are you sure you want to remove this menu from your order?",
      type: "danger",
      confirmText: "Clear Order",
      cancelText: "Cancel",
      itemName: group.menuName,
    });
    if (!ok) {
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
  const handleEditGroup = async (group: any) => {
    const res = await (window as any).electronAPI.getMenuById(token, group.menuId);
    if (!res.status) {
      toast.error(`Error getting menu`);
      return;
    }
    setMode("menu");
    setEditingGroup(group);
    setSelectedMenu(res.data);
    setSelectedProduct(null);
  }
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
    if (!ok) {
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
      <div className="text-center text-gray-500 py-8 p-4 h-[calc(100vh-9rem)]">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-lg font-medium">Your Order</p>
        <p className="text-sm">
          Select items from the menu to add to your order
        </p>
      </div>
    );
  }
  return (
    <div className="h-[calc(100vh-5.2rem)] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Your Order</h2>
        <div className="flex items-center gap-1">
            <CustomButton type="button" onClick={handlePrint} title="Print Options" Icon={<PrinterIcon className="size-5" />} className="!px-2" variant="transparent" />
          <CustomButton type="button" onClick={handleClearOrder} title="Save Order" Icon={<DeleteIcon className="size-5" />} className="!px-2 text-red-600 hover:text-red-700" variant="transparent" />
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
              <div className="ml-2 flex gap-2">
                <CustomButton type="button" onClick={() =>
                  handleEditItem(item)
                } variant="transparent" Icon={<EditIcon className="size-4" />} className="!p-0" />
                <CustomButton type="button" onClick={() =>
                  handleRemoveItem(item.id || "", item.productName)
                } className="!p-0 text-sm text-red-500 hover:text-red-700" variant="transparent" label="✕" />
              </div>
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
                €{(item.totalPrice * item.quantity).toFixed(2)}
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
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">
                    From {group.menuName} - {group.secondaryId}
                  </h3>
                  <div className="flex gap-2">
                    <CustomButton type="button" onClick={() =>
                      handleEditGroup(
                        group
                      )
                    } variant="transparent" Icon={<EditIcon className="size-4" />} className="!p-0" />
                    <CustomButton type="button" onClick={() =>
                      handleRemoveGroup(
                        group
                      )
                    } className="!p-1 !rounded-full !text-sm ml-2 bg-red-500 text-white hover:!text-gray-100 hover:bg-red-700" variant="transparent" Icon={<CrossIcon className="size-4" />} />
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
        <CustomButton label="Process Order" type="button" className="w-full" onClick={onProcessOrder} />
      </div>
    </div>
  );
};

export default OrderCart;
