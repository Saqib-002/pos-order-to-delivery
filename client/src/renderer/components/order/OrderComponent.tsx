import { useEffect, useState } from "react";
import OrderCart from "./OrderCart";
import OrderProcessingModal from "./OrderProcessingModal";
import { useOrder } from "../../contexts/OrderContext";
import { toast } from "react-toastify";
import { Order } from "@/types/order";
import { StringToComplements, updateOrder } from "@/renderer/utils/order";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { calculatePaymentStatus } from "@/renderer/utils/paymentStatus";
import {
  translateOrderStatus,
  getOrderStatusStyle,
  translatePaymentStatus,
  getPaymentStatusStyle,
} from "@/renderer/utils/orderStatus";
import { useOrderManagementContext } from "@/renderer/contexts/orderManagementContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";

const OrderComponent = () => {
  const {
    orderItems,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    addToOrder,
    order,
    setOrder,
  } = useOrder();
  const { orders, refreshOrdersCallback } = useOrderManagementContext();
  const { configurations } = useConfigurations();
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const {
    auth: { token },
  } = useAuth();
  useEffect(() => {
    if (orderItems.length == 0) {
      refreshOrdersCallback();
    }
  }, [orderItems]);
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
  };
  const handleOrderClick = async (order: Order) => {
    // Check if order is assigned to a delivery person
    if (order.deliveryPerson && order.deliveryPerson.id) {
      toast.info(
        "This order is assigned to a delivery person and cannot be edited. It can only be viewed."
      );
      return;
    }

    setOrder(order);
    if (order.items) {
      order.items.forEach((item: any) => {
        addToOrder({
          ...item,
          complements: StringToComplements(item.complements),
        });
      });
    }
  };
  return (
    <>
      {orderItems.length > 0 ? (
        <OrderCart
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
            <div className="h-[calc(100vh-3.9rem)] overflow-y-auto">
              {orders.map((order) => {
                const { orderTotal } = order.items
                  ? calculateOrderTotal(order.items)
                  : { orderTotal: 0 };
                const paymentStatus = calculatePaymentStatus(
                  order.paymentType || "",
                  orderTotal
                );

                const getOrderTypeStyle = (orderType: string) => {
                  switch (orderType?.toLowerCase()) {
                    case "pickup":
                      return "bg-blue-100 text-blue-800 border-blue-200";
                    case "dine-in":
                      return "bg-purple-100 text-purple-800 border-purple-200";
                    case "delivery":
                      return "bg-orange-100 text-orange-800 border-orange-200";
                    default:
                      return "bg-gray-100 text-gray-800 border-gray-200";
                  }
                };

                const isAssignedToDelivery = Boolean(
                  order.deliveryPerson && order.deliveryPerson.id
                );

                return (
                  <button
                    key={order.id}
                    className={`flex justify-between items-center gap-3 border-b border-gray-400 mb-3 pb-3 w-full px-3 py-2 transition-all duration-200 ${
                      isAssignedToDelivery
                        ? "bg-gray-100 cursor-not-allowed opacity-75"
                        : "hover:bg-gray-50 cursor-pointer"
                    }`}
                    onClick={() => handleOrderClick(order)}
                    disabled={isAssignedToDelivery}
                  >
                    <div className="flex flex-col items-start gap-2 flex-1">
                      {/* Order Number and Total */}
                      <div className="flex items-center justify-between gap-3 w-full">
                        <h3 className="font-semibold text-black text-xl">
                          {configurations.orderPrefix || "K"}
                          {order.orderId}
                        </h3>
                        <div className="text-xl font-bold text-black">
                          €{orderTotal.toFixed(2)}
                        </div>
                      </div>

                      {/* Status Pills Row */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Order Type Pill */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOrderTypeStyle(order.orderType || "")}`}
                        >
                          {order.orderType
                            ? order.orderType.toUpperCase()
                            : "NOT SELECTED"}
                        </span>

                        {/* Order Status Pill */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusStyle(order.status || "")}`}
                        >
                          {translateOrderStatus(order.status || "")}
                        </span>

                        {/* Payment Status Pill */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusStyle(paymentStatus.status)}`}
                        >
                          {translatePaymentStatus(paymentStatus.status)}
                        </span>

                        {/* Delivery Person Assigned Pill */}
                        {isAssignedToDelivery && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            🚚 {order.deliveryPerson?.name}
                          </span>
                        )}
                      </div>

                      {/* Partial Payment Info */}
                      {paymentStatus.status === "PARTIAL" && (
                        <p className="text-xs text-yellow-700 font-medium">
                          Paid: €{paymentStatus.totalPaid.toFixed(2)} / €
                          {orderTotal.toFixed(2)}
                        </p>
                      )}

                      {/* Customer Info (if available) */}
                      {order.customer && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">
                            {order.customer.name}
                          </span>
                          {order.customer.phone && (
                            <span className="ml-1">
                              • {order.customer.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-black mb-1">
                  No Orders
                </h3>
                <p className="text-gray-500 text-sm">
                  No orders available to display
                </p>
              </div>
            </div>
          )}
        </>
      )}
      {isProcessingModalOpen && (
        <OrderProcessingModal
          onClose={() => setIsProcessingModalOpen(false)}
          orderItems={orderItems}
          order={order}
          onProcessOrder={handleProcessOrderSubmit}
        />
      )}
    </>
  );
};

export default OrderComponent;
