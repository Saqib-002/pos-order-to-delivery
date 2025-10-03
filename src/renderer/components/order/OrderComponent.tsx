import React, { useState } from "react";
import OrderCart from "./OrderCart";
import OrderProcessingModal from "./OrderProcessingModal";
import { useOrder } from "../../contexts/OrderContext";
import { toast } from "react-toastify";
import { Order } from "@/types/order";
import { StringToComplements } from "@/renderer/utils/order";

interface OrderComponentProps {
  token: string | null;
  orders: Order[];
  refreshOrdersCallback: () => void;
}

const OrderComponent = ({
  token,
  orders,
  refreshOrdersCallback,
}: OrderComponentProps) => {
  const {
    orderItems,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    addToOrder,
    order,
    setOrder,
  } = useOrder();
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const handleProcessOrder = () => {
    if (orderItems.length === 0) {
      alert("No items in order");
      return;
    }
    setIsProcessingModalOpen(true);
  };

  const handleProcessOrderSubmit = async (orderData: any) => {
    const result = await (window as any).electronAPI.saveOrder(
      token,
      orderData
    );
    if (!result.status) {
      toast.error("Unable to save order");
      return;
    }
    toast.success("Order saved successfully");
    clearOrder();
    refreshOrdersCallback();
  };
  const handleOrderClick = async (order: Order) => {
    setOrder(order);
    console.log(order);
    if (order.items) {
      order.items.forEach((item: any) => {
        addToOrder({ ...item, complements: StringToComplements(item.complements) });
      });
    }
  };
  return (
    <>
      {orderItems.length > 0 ? (
        <OrderCart
          token={token}
          orderId={order!.id}
          orderItems={orderItems}
          onRemoveItem={removeFromOrder}
          onUpdateQuantity={updateQuantity}
          onClearOrder={clearOrder}
          onProcessOrder={handleProcessOrder}
        />
      ) : (
        <>
          {orders.length > 0 ? (
            <div className="py-2 text-center text-gray-700">
              {orders.map((order) => (
                <button
                  key={order.id}
                  className="flex justify-between items-center gap-2 border-b border-gray-300 mb-2 pb-2 hover:border-gray-500 hover:shadow-md w-full px-2 cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex flex-col items-start gap-2">
                    <p>
                      {/* {order.orderType?order.orderType?.toUpperCase():"Not Selected"} */}
                      <span className="border-2 border-green-500 bg-green-300 rounded-full px-2 py-[2px] text-xs  ml-2">
                        PAID
                      </span>
                    </p>
                    <p>Order No. K{order.orderId}</p>
                    <p>{order.status}</p>
                  </div>
                  <p className="text-2xl">
                    €
                    {order.items?order.items
                      .reduce(
                        (total, item) =>
                          total + (item.totalPrice || 0) * item.quantity,
                        0
                      )
                      .toFixed(2):"0.00"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">No items in the order</div>
          )}
        </>
      )}
      <OrderProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => {
          setIsProcessingModalOpen(false);
          setIsEditingOrder(false);
          setEditingOrderId(null);
        }}
        orderItems={orderItems}
        onProcessOrder={handleProcessOrderSubmit}
        token={token}
        isEditing={isEditingOrder}
        editingOrderId={editingOrderId}
      />
    </>
  );
};

export default OrderComponent;
