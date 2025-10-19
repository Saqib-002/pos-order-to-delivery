import React, { createContext, useContext, ReactNode } from "react";
import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { StringToComplements } from "../utils/order";

const useOrderManagementInternal = (auth: AuthState) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<FilterType>({
        searchTerm: "",
        selectedDate: null,
        selectedStatus: ["all"],
        selectedPaymentStatus: [],
        selectedDeliveryPerson: "",
        page:0,
        limit:0,
        startDateRange: null,
        endDateRange: null,
    });

  const convertOrderItems = (orders: Order[]): Order[] => {
    return orders.map((order) => ({
      ...order,
      items:
        order.items?.map((item) => ({
          ...item,
          complements: StringToComplements(
            typeof item.complements === "string" ? item.complements : ""
          ),
        })) || [],
    }));
  };

  const refreshOrdersCallback = async () => {
    if (!auth.token) return;
    try {
      const res = await (window as any).electronAPI.getOrdersByFilter(
        auth.token,
        filter
      );
      if (!res.status) {
        toast.error("Error fetching orders");
        return;
      }
      setOrders(convertOrderItems(res.data || []));
    } catch (error) {
      toast.error("Failed to refresh orders");
    }
  };

  useEffect(() => {
    if (!auth.token) return;
    refreshOrdersCallback();
  }, [auth.token, filter]);

  return { orders, setOrders, filter, setFilter, refreshOrdersCallback };
};

interface OrderContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  filter: FilterType;
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
      "useOrderManagementContext must be used within an OrderManagementProvider"
    );
  }
  return context;
};
