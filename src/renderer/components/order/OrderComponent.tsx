import { useState } from "react";
import OrderCart from "./OrderCart";
import OrderProcessingModal from "./OrderProcessingModal";
import { useOrder } from "../../contexts/OrderContext";
import { toast } from "react-toastify";
import { Order } from "@/types/order";
import { StringToComplements, updateOrder } from "@/renderer/utils/order";
import { useAuth } from "@/renderer/contexts/AuthContext";

interface OrderComponentProps {
  orders: Order[];
  refreshOrdersCallback: () => void;
}

const OrderComponent = ({
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
  const { auth: { token } } = useAuth();

  const handleProcessOrder = () => {
    if (orderItems.length === 0) {
      toast.error("No items in the order");
      return;
    }
    setIsProcessingModalOpen(true);
  };

  const handleProcessOrderSubmit = async (orderData: any) => {
    const result = await updateOrder(token!, order!.id, orderData);
    if (!result) {
      toast.error("Failed to process order");
      return;
    }
    toast.success("Order processed successfully");
    clearOrder();
    refreshOrdersCallback();
  };
  const handleOrderClick = async (order: Order) => {
    setOrder(order);
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
                      {order.orderType ? order.orderType?.toUpperCase() : "Not Selected"}
                      <span className={`border-2 ${order.isPaid ? "border-green-500 bg-green-300" : "border-red-500 bg-red-300"} rounded-full px-2 py-[2px] text-xs  ml-2`}>
                        {order.isPaid ? "PAID" : "UNPAID"}
                      </span>
                    </p>
                    <p>Order No. K{order.orderId}</p>
                    <p>{order.status}</p>
                  </div>
                  <p className="text-2xl">
                    €
                    {order.items ? order.items
                      .reduce(
                        (total, item) =>
                          total + (item.totalPrice || 0) * item.quantity,
                        0
                      )
                      .toFixed(2) : "0.00"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">No items in the order</div>
          )}
        </>
      )}
      {
        isProcessingModalOpen && (
          <OrderProcessingModal
            onClose={() => setIsProcessingModalOpen(false)}
            orderItems={orderItems}
            order={order}
            onProcessOrder={handleProcessOrderSubmit}
          />
        )
      }
    </>
  );
};

export default OrderComponent;
