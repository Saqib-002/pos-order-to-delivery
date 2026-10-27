import React, { createContext, useContext, ReactNode } from "react";
import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
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

  // New synced web/app order: refresh the lists. The sound and receipt are
  // handled by the alert listener below, which keeps being retried until done.
  useEffect(() => {
    if (!auth.token) return;
    if (!(window as any).electronAPI?.onNewWebOrder) return;

    const cleanup = (window as any).electronAPI.onNewWebOrder(() => {
      refreshOrdersCallback();
    });

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [auth.token, filter]);

  // Latest refresh function for the alert listener (which isn't re-subscribed
  // on every filter change)
  const refreshOrdersRef = useRef(refreshOrdersCallback);
  refreshOrdersRef.current = refreshOrdersCallback;
  // Orders being handled right now, so overlapping alert rounds don't double up
  const alertsInFlightRef = useRef<Set<string>>(new Set());
  // Orders already announced with a toast this session
  const announcedOrdersRef = useRef<Set<string>>(new Set());

  // Sound + receipt for web/app orders. The master POS sends every order that
  // still needs them after each sync (every ~10s) until they are recorded on
  // the order — so orders that arrived while this POS was starting up, logged
  // out, or the printer was briefly unreachable are not missed.
  useEffect(() => {
    if (!auth.token) return;
    const api = (window as any).electronAPI;
    if (!api?.onWebOrderAlert) return;
    const token = auth.token;

    const handleOrder = async ({
      order,
      items,
      needsSound,
    }: {
      order: any;
      items: any[];
      needsSound: boolean;
    }) => {
      // 1. Notification sound (once per order)
      if (needsSound) {
        const played = await playNotificationSound();
        if (played) {
          await api.markWebOrderAlert(token, order.id, { notified: true });
        }
        if (!announcedOrdersRef.current.has(order.id)) {
          announcedOrdersRef.current.add(order.id);
          const ticketNum = order.ticketNumber || order.orderId || "";
          toast.info(
            t("orderManagement.newOrderReceived", {
              ticketNumber: ticketNum ? `#${ticketNum}` : "",
              defaultValue: `¡Nuevo pedido recibido! ${ticketNum ? `#${ticketNum}` : ""}`,
            }),
            { autoClose: 5000 }
          );
          refreshOrdersRef.current();
        }
      }

      // 2. Receipt
      let printError = "";
      const printed = await printOrder({
        order,
        orderItems: items,
        token,
        user: auth.user,
        t,
        onError: (message) => {
          printError = message;
        },
      });
      const res = await api.markWebOrderAlert(
        token,
        order.id,
        printed ? { printed: true } : { printed: false, error: printError }
      );

      // Out of retries: stays on screen until staff close it
      const attempts = res?.data?.attempts ?? 0;
      const maxAttempts = res?.data?.maxAttempts ?? 0;
      if (!printed && maxAttempts > 0 && attempts >= maxAttempts) {
        const ticketNum = order.ticketNumber || order.orderId || "";
        toast.error(
          t("orderManagement.autoPrintFailed", {
            ticketNumber: ticketNum ? `#${ticketNum}` : "",
            error: printError || "-",
          }),
          { autoClose: false }
        );
      }
    };

    const cleanup = api.onWebOrderAlert(async (pending: any[]) => {
      for (const alert of pending || []) {
        const id = alert?.order?.id;
        if (!id || alertsInFlightRef.current.has(id)) continue;
        alertsInFlightRef.current.add(id);
        try {
          await handleOrder(alert);
        } catch (err) {
          console.error("Web order alert failed:", err);
        } finally {
          alertsInFlightRef.current.delete(id);
        }
      }
    });

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [auth.token, auth.user, t]);

  // Listen for real-time order status updates synced from driver mobile app
  useEffect(() => {
    if (!auth.token) return;
    if (!(window as any).electronAPI?.onOrdersUpdatedFromSync) return;

    const cleanup = (window as any).electronAPI.onOrdersUpdatedFromSync(
      (updates: any[]) => {
        if (Array.isArray(updates) && updates.length > 0) {
          setOrders((prev) =>
            prev.map((order) => {
              const match = updates.find((u) => u.id === order.id);
              if (match) {
                return {
                  ...order,
                  status: match.status,
                  deliveredAt: match.deliveredAt || order.deliveredAt,
                };
              }
              return order;
            })
          );
          refreshOrdersCallback();
        }
      }
    );

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [auth.token, refreshOrdersCallback]);

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
