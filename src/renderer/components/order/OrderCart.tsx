import { OrderItem } from "@/types/order";
import React from "react";
import { toast } from "react-toastify";

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
  const nonMenuItems = orderItems.filter((item) => !item.menuId);

  const menuGroups = orderItems
    .filter((item) => item.menuId)
    .reduce(
      (
        acc: Record<
          string,
          {
            key: string;
            menuId: string;
            menuName: string;
            secondaryId: number;
            basePrice: number;
            taxPerUnit: number;
            items: OrderItem[];
          }
        >,
        item
      ) => {
        const key = `${item.menuId}-${item.menuSecondaryId}`;
        const menuPrice = item.menuPrice ?? 0;
        const menuTax = item.menuTax ?? 0;
        if (!acc[key]) {
          acc[key] = {
            key,
            menuId: item.menuId!,
            menuName: item.menuName!,
            secondaryId: item.menuSecondaryId! as number,
            basePrice: menuPrice,
            taxPerUnit: menuTax,
            items: [],
          };
        } else {
          acc[key].basePrice += menuPrice;
          acc[key].taxPerUnit += menuTax;
        }
        acc[key].items.push(item);
        return acc;
      },
      {}
    );

  const groups = Object.values(menuGroups);

  const calculateTotal = () => {
    let total = nonMenuItems.reduce((sum, item) => sum + item.totalPrice, 0);
    groups.forEach((group) => {
      const qty = group.items[0]?.quantity || 1;
      total += (group.basePrice + group.taxPerUnit) * qty;
    });
    return total;
  };

  const handleRemoveItem = async (itemId: string | undefined) => {
    const res = await (window as any).electronAPI.removeItemFromOrder(token, orderId, itemId);
    if (!res.status) {
      toast.error(`Error removing item`);
      return;
    }
    onRemoveItem(itemId);
  };

  const handleRemoveGroup = async (group: any) => {
    const res=await (window as any).electronAPI.removeMenuFromOrder(token, orderId, group.menuId,group.secondaryId);
    if (!res.status) {
      toast.error(`Error removing item`);
      return;
    }
    group.items.forEach((item:any) => onRemoveItem(item.id));
  };

  const handleUpdateGroupQuantity = async (group: any, quantity: number) => {
    const res=await (window as any).electronAPI.updateMenuQuantity(token, orderId, group.menuId,group.secondaryId,quantity);
    if (!res.status) {
      toast.error(`Error updating quantity`);
      return;
    }
    group.items.forEach((item:any) => onUpdateQuantity(item.id, quantity));
  };

  const handleClearOrder = async () => {
    const res = await (window as any).electronAPI.deleteOrder(token, orderId);
    if (!res.status) {
      toast.error(`Error clearing order`);
      return;
    }
    onClearOrder();
  };

  const handleUpdateQuantity = async (itemId: string | undefined, quantity: number) => {
    const res = await (window as any).electronAPI.updateItemQuantity(token, itemId, quantity);
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
    <div className="h-[calc(100vh-9rem)] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Your Order</h2>
        <button onClick={handleClearOrder} className="text-sm text-red-600 hover:text-red-800">
          Clear
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {/* Non-Menu Items */}
        {nonMenuItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{item.productName}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Product</span>
                    <span>€{item.productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span>€{item.productTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variant: {item.variantName}</span>
                    <span>€{item.variantPrice.toFixed(2)}</span>
                  </div>
                </div>
                {item.complements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium">Add-ons:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.complements.map((complement, index) => (
                        <li key={index} className="flex justify-start">
                          <span>• {complement.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700 text-sm ml-2"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-gray-800">€{item.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        ))}

        {/* Menu Groups */}
        {groups.map((group) => {
          const sectionQuantity = group.items[0]?.quantity || 1;
          const sectionSubtotal = group.basePrice * sectionQuantity;
          const sectionTaxTotal = group.taxPerUnit * sectionQuantity;
          const sectionTotal = sectionSubtotal + sectionTaxTotal;
          return (
            <div key={group.key} className="bg-white border border-gray-200 rounded-lg mb-3">
              <div className="flex justify-between items-start p-3 bg-gray-50 rounded-t-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">
                    From {group.menuName} - {group.secondaryId}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span>€{group.basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>€{group.taxPerUnit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateGroupQuantity(group, Math.max(1, sectionQuantity - 1))}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{sectionQuantity}</span>
                    <button
                      onClick={() => handleUpdateGroupQuantity(group, sectionQuantity + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-gray-800">€{sectionTotal.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveGroup(group)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="border-t border-gray-200 pt-3">
                    <div className="flex justify-start items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item.productName}</h3>
                        <div className="text-xs text-indigo-600 mb-1">
                          Page: {item.menuPageName}
                          {item.supplement && item.supplement > 0 && (
                            <span className="ml-1"> (+€{item.supplement.toFixed(2)}) </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Base Product</span>
                            <span>€{item.productPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Tax</span>
                            <span>€{item.productTax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Variant: {item.variantName}</span>
                            <span>€{item.variantPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 font-medium">Add-ons:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {item.complements.map((complement, index) => (
                                <li key={index} className="flex justify-start">
                                  <span>• {complement.itemName}</span>
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
          <span className="text-indigo-600">€{calculateTotal().toFixed(2)}</span>
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