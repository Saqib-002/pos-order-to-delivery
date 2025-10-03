import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useOrderManagement = (auth: AuthState, filter: FilterType) => {
    const [orders, setOrders] = useState<Order[]>([]);

    const refreshOrdersCallback = async () => {
        if (!auth.token) return;
        try {
            const res = await (window as any).electronAPI.getOrdersByFilter(
                auth.token,
                filter
            );
            console.log("Fetched orders:", res,filter);
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

    return { orders, setOrders, refreshOrdersCallback };
};