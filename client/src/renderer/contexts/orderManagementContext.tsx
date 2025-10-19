import React, { createContext, useContext, ReactNode } from "react";
import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

const useOrderManagementInternal = (auth: AuthState) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<FilterType>({
        searchTerm: "",
        selectedDate: null,
        selectedStatus: ["all"],
        selectedPaymentStatus: [],
    });

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
            setOrders(res.data || []);
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
    auth 
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
        throw new Error("useOrderContext must be used within an OrderProvider");
    }
    return context;
};