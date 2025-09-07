import { FilterType, Order } from "@/types/order";
import { AuthState } from "@/types/user";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { handleOrderChange, refreshOrders } from "../utils/order";

export const useOrderManagement = (auth: AuthState, filter: FilterType) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const orderChangeCleanupRef = useRef<(() => void) | null>(null);

    const refreshOrdersCallback = async () => {
        if (!auth.token) return;
        try {
            refreshOrders(setOrders, auth.token, filter);
        } catch (error) {
            toast.error("Failed to refresh orders");
        }
    };

    useEffect(() => {
        if (!auth.token) return;

        refreshOrdersCallback();
        const cleanup = (window as any).electronAPI.onOrderChange(
            (change: any) => {
                try {
                    handleOrderChange({ auth, change, setOrders, audioRef });
                } catch (error) {
                    toast.error("Failed to handle order change");
                }
            }
        );
        orderChangeCleanupRef.current = cleanup;

        return () => {
            orderChangeCleanupRef.current?.();
            orderChangeCleanupRef.current = null;
        };
    }, [auth.token]);

    useEffect(() => {
        refreshOrdersCallback();
    }, [filter]);

    return { orders, setOrders, refreshOrdersCallback };
};
