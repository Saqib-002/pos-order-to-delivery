import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useOrderManagement = (auth: AuthState) => {
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
