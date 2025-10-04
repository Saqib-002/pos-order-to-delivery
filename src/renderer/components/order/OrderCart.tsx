import { OrderItem } from "@/types/order";
import React from "react";
import { toast } from "react-toastify";


interface OrderCartProps {
  token: string | null;
  orderId: string;
  orderItems: OrderItem[];
  onRemoveItem: (itemId: string|undefined) => void;
  onUpdateQuantity: (itemId: string|undefined, quantity: number) => void;
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
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };
  if (orderItems.length === 0) {
    return (
      <div className="p-4">
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
  const handleRemoveItem = async (itemId: string|undefined) => {
    const res=await (window as any).electronAPI.removeItemFromOrder(token,orderId,itemId);
    if (!res.status){
      toast.error(`Error removing item`);
      return;
    }
    onRemoveItem(itemId);
  };
  const handleClearOrder = async () => {
    const res=await (window as any).electronAPI.deleteOrder(token,orderId);
    if (!res.status){
      toast.error(`Error clearing order`);
      return;
    }
    onClearOrder();
  };
  const handleUpdateQuantity =async (itemId: string|undefined, quantity: number) => {
    const res=await (window as any).electronAPI.updateItemQuantity(token,itemId,quantity);
    if (!res.status){
      toast.error(`Error updating quantity`);
      return;
    }
    onUpdateQuantity(itemId, quantity);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Your Order</h2>
        <button
          onClick={handleClearOrder}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Clear
        </button>
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 min-h-0">
        {orderItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">
                  {item.productName}
                </h3>
                {item.menuId && (
                  <div className="text-xs text-indigo-600 mb-1">
                    From: {item.menuName} -{" "}
                    {item.menuPageName}
                    {item.supplement && item.supplement > 0 && (
                      <span className="ml-1">
                        (+€{item.supplement.toFixed(2)})
                      </span>
                    )}
                  </div>
                )}
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
                    <p className="text-xs text-gray-500 font-medium">
                      Add-ons:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.complements.map((complement, index) => (
                        <li key={index} className="flex justify-between">
                          <span>• {complement.itemName}</span>
                          <span>+€{complement.price.toFixed(2)}</span>
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
                  onClick={() =>
                    handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-gray-800">
                €{item.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary - Fixed at bottom */}
      <div className="border-t border-gray-200 px-4">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total:</span>
          <span className="text-indigo-600">
            €{calculateTotal().toFixed(2)}
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
