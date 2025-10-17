import { useEffect, useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FilterControls } from "../components/shared/FilterControl.order";
import { Order } from "@/types/order";
import { StatsCard } from "../components/shared/StatsCard.order";
import SentToKitchenIcon from "../assets/icons/sent-to-kitchen.svg?react";

// ICONS
import TotalOrdersIcon from "../assets/icons/total-orders.svg?react";
import HighPriorityIcon from "../assets/icons/high-priority.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";
import MarkIcon from "../assets/icons/mark.svg?react";
import EyeIcon from "../assets/icons/eye.svg?react";

import { useAuth } from "../contexts/AuthContext";
import { updateOrder, StringToComplements } from "../utils/order";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import OrderDetailsModal from "../components/order/modals/OrderDetailsModal";
import { useOrderManagement } from "../hooks/useOrderManagement";

export const KitchenView = () => {
  const {
    auth
  } = useAuth();
  const { token } = auth;
  const { orders, filter, setFilter, refreshOrdersCallback } = useOrderManagement(
    auth
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  useEffect(() => {
    setFilter({
      selectedDate: null,
      searchTerm: "",
      selectedStatus: ["sent to kitchen"],
      selectedPaymentStatus: [],
    });
  }, [token, setFilter]);

  const markAsReady = useCallback(
    async (order: Order) => {
      try {
        // Determine status based on order type
        let newStatus: string;
        if (order.orderType === "delivery") {
          newStatus = "ready for delivery";
        } else {
          // For pickup and dine-in orders, mark as completed
          newStatus = "completed";
        }

        const res = await updateOrder(token, order.id, {
          status: newStatus,
          readyAt: new Date(Date.now()).toISOString(),
        });
        if (!res) {
          toast.error("Failed to update order");
          return;
        }
        refreshOrdersCallback();
        toast.success(
          `Order marked as ${newStatus === "completed" ? "completed" : "ready"}`
        );
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    },
    [token, refreshOrdersCallback]
  );

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  const parseComplements = (complements: any) => {
    if (Array.isArray(complements)) return complements;
    if (typeof complements === "string") {
      return StringToComplements(complements);
    }

    return [];
  };

  const stats = useMemo(() => {
    const highPriorityCount = orders.filter((order) => {
      const orderTime = new Date(order.createdAt || order.id);
      const now = new Date();
      const diffHours =
        (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
      return diffHours > 1;
    }).length;

    return [
      {
        title: "Orders in Kitchen",
        value: orders.length,
        icon: <TotalOrdersIcon className="size-6 text-blue-600" />,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      },
      {
        title: "High Priority",
        value: highPriorityCount,
        icon: <HighPriorityIcon className="w-6 h-6 text-red-600" />,
        bgColor: "bg-red-100",
        textColor: "text-red-600",
      },
      {
        title: "Avg Prep Time",
        value: "~25 min",
        icon: <ThunderIcon className="w-6 h-6 text-green-600" />,
        bgColor: "bg-green-100",
        textColor: "text-green-600",
      },
    ];
  }, [orders]);

  const hasKitchenOrders = orders.some(
    (o) => o.status.toLowerCase() === "sent to kitchen"
  );
  const getPriorityLabel = (diffMinutes: number) => {
    if (diffMinutes > 120)
      return { label: "High", color: "bg-red-100 text-red-800" };
    if (diffMinutes > 60)
      return { label: "Medium", color: "bg-orange-100 text-orange-800" };
    return { label: "Low", color: "bg-blue-100 text-blue-800" };
  };
  const getPriorityColor = (order: Order) => {
    const orderTime = new Date(order.createdAt || order.id);
    const now = new Date();
    const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

    if (diffHours > 2) return "border-red-500 bg-red-50";
    if (diffHours > 1) return "border-orange-500 bg-orange-50";
    return "border-blue-500 bg-blue-50";
  };
  const OrderRowRenderer = (order: Order) => {
    const orderTime = new Date(order.createdAt || "");
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    const timeInKitchen = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    const { label, color } = getPriorityLabel(diffMinutes);
    return (
      <tr
        className={`hover:bg-gray-50 transition-colors duration-150 ${getPriorityColor(order)}`}
        key={order.id}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
          >
            {label}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          K{order.orderId}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {order.customer.name}
        </td>
        <td className="px-6 py-4 min-w-[300px] text-sm text-gray-900">
          <div className="space-y-2">
            {order.items &&
              order.items.map((item, index) => {
                const parsedComplements = parseComplements(item.complements);
                return (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-0 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.quantity}x {item.productName}
                          {item.variantName && (
                            <span className="text-gray-600">
                              {" "}
                              ({item.variantName})
                            </span>
                          )}
                        </div>
                        {parsedComplements.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Add-ons:</span>{" "}
                            {parsedComplements
                              .map((c) => c.itemName)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 font-medium">
            {timeInKitchen}
          </div>
          <div className="text-xs text-gray-500">
            {orderTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center gap-2 justify-end min-w-[120px]">
            <button
              onClick={() => handleViewDetails(order)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
              title="View Order Details"
            >
              <EyeIcon className="size-4" />
            </button>
            <button
              onClick={() => markAsReady(order)}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
              title="Mark as Ready"
            >
              <MarkIcon className="size-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };
  return (
    <div className="p-4 flex flex-col">
      <Header
        title="Kitchen Management"
        subtitle="Monitor and manage orders in preparation"
        icon={<SentToKitchenIcon className="text-orange-600 size-8" />}
        iconbgClasses="bg-orange-100"
      />
      <div className="flex-1">
        <div className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {orders.length > 0
                      ? "Kitchen Orders"
                      : "No orders match your search"}
                  </h3>
                </div>
                <FilterControls filter={filter} setFilter={setFilter} />
              </div>
            </div>
            <OrderTable
              data={orders}
              columns={[
                "Priority",
                "Order ID",
                "Customer",
                "Items",
                "Time in Kitchen",
                "Actions",
              ]}
              renderRow={OrderRowRenderer}
            />
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};
