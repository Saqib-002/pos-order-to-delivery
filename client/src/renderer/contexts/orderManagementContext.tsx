import React, { createContext, useContext, ReactNode } from "react";
import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StringToComplements } from "../utils/order";
import { DEFAULT_PAGE_LIMIT } from "@/constants";
import { playNotificationSound } from "../utils/audio";
import { printOrder } from "../utils/printer";

const useOrderManagementInternal = (auth: AuthState) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [filter, setFilter] = useState<FilterType>({
    searchTerm: "",
    selectedDate: new Date(),
    selectedStatus: ["all"],
    selectedPaymentStatus: [],
    selectedDeliveryPerson: "",
    selectedCustomer: "",
    selectedOrderType: "",
    page: 0,
    limit: DEFAULT_PAGE_LIMIT,
    startDateRange: null,
    endDateRange: null,
  });

  const convertOrderItems = (orders: Order[]): Order[] => {
    return orders.map((order) => ({
      ...order,
      items:
        order.items?.map((item) => ({
          ...item,
          complements: StringToComplements(item.complements),
        })) || [],
    }));
  };
  const refreshOrdersCallback = async () => {
    if (!auth.token) return;
    try {
      const res = await (window as any).electronAPI.getOrdersByFilter(
        auth.token,
        filter,
      );
      if (!res.status) {
        toast.error("Error fetching orders");
        return;
      }
      setOrders(convertOrderItems(res.data.orders || []));
      setTotalOrders(res.data.totalCount || 0);
    } catch (error) {
      toast.error("Failed to refresh orders");
    }
  };

  useEffect(() => {
    if (!auth.token) return;
    refreshOrdersCallback();
    const interval = setInterval(() => {
      refreshOrdersCallback();
    }, 5000);
    return () => clearInterval(interval);
  }, [auth.token, filter]);

  // Listen for new synced web/app orders, play notification sound, and print receipt
  useEffect(() => {
    if (!auth.token) return;
    if (!(window as any).electronAPI?.onNewWebOrder) return;

    const cleanup = (window as any).electronAPI.onNewWebOrder(async (data: any) => {
      // 1. Notification sound plays first
      await playNotificationSound();

      const ticketNum = data?.order?.ticketNumber || data?.order?.orderId || "";
      const message = t("orderManagement.newOrderReceived", {
        ticketNumber: ticketNum ? `#${ticketNum}` : "",
        defaultValue: `¡Nuevo pedido recibido! ${ticketNum ? `#${ticketNum}` : ""}`,
      });
      toast.info(message, {
        autoClose: 5000,
      });
      refreshOrdersCallback();

      // 2. Print receipt after notification sound
      try {
        await printOrder({
          order: data?.order,
          orderItems: data?.items,
          token: auth.token,
          user: auth.user,
          t,
        });
      } catch (err) {
        console.error("Auto-print error on synced web order:", err);
      }
    });

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [auth.token, filter, t]);

  return {
    orders,
    setOrders,
    filter,
    totalOrders,
    setFilter,
    refreshOrdersCallback,
  };
};

interface OrderContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  filter: FilterType;
  totalOrders: number;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  refreshOrdersCallback: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderManagementProvider = ({
  children,
  auth,
}: {
  children: ReactNode;
  auth: AuthState;
}) => {
  const contextValue = useOrderManagementInternal(auth);

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderManagementContext = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error(
      "useOrderManagementContext must be used within an OrderManagementProvider",
    );
  }
  return context;
};
