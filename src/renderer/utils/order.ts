import { FilterType, Order } from "@/types/order";
import { showToast } from "./utils";
import { AuthState } from "@/types/user";
import { toast } from "react-toastify";
import { NOTIFICATION_VOLUME } from "@/constants";

interface HandleOrderChangeArgs {
    change: any;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    auth: AuthState;
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const handleOrderChange = ({
    change,
    setOrders,
    auth,
    audioRef,
}: HandleOrderChangeArgs) => {
    setOrders((prevOrders) => {
        console.log("Processing order change:", change);

        if (change.type === "delete") {
            // Handle deletion
            const deletedOrder = prevOrders.find(
                (order) => order.id === change.id
            );
            if (deletedOrder) {
                toast.info(
                    `Order #${deletedOrder.orderId || "N/A"} has been deleted`
                );
            }
            return prevOrders.filter((order) => order.id !== change.id);
        }

        if (change.type === "insert") {
            // Handle new order insertion
            if (change.doc) {
                const newOrder = change.doc;
                // Check if order already exists to avoid duplicates
                const exists = prevOrders.some(
                    (order) => order.id === newOrder.id
                );
                if (!exists) {
                    toast.success(
                        `New order #${newOrder.orderId || "N/A"} received`
                    );
                    // Play notification sound if available
                    if (audioRef.current) {
                        audioRef.current.volume = NOTIFICATION_VOLUME;
                        audioRef.current.play().catch(console.error);
                    }
                    return [...prevOrders, newOrder];
                }
            }
            return prevOrders;
        }

        if (change.type === "update") {
            // Handle order updates
            if (change.doc) {
                const updatedOrder = change.doc;
                const existingIndex = prevOrders.findIndex(
                    (order) => order.id === updatedOrder.id
                );

                if (existingIndex !== -1) {
                    const updatedOrders = [...prevOrders];
                    const oldOrder = updatedOrders[existingIndex];
                    updatedOrders[existingIndex] = updatedOrder;

                    // Show notification about status change
                    if (oldOrder.status !== updatedOrder.status) {
                        toast.info(
                            `Order #${updatedOrder.orderId || "N/A"} status changed to: ${updatedOrder.status}`,
                            { autoClose: 3000 }
                        );
                    }

                    return updatedOrders;
                } else {
                    // Order doesn't exist locally, add it
                    toast.info(
                        `Order #${updatedOrder.orderId || "N/A"} synchronized`
                    );
                    return [...prevOrders, updatedOrder];
                }
            }
            return prevOrders;
        }

        // Fallback: refresh all orders if change type is unrecognized
        console.warn("Unrecognized change type, refreshing orders");
        if (auth.token) {
            refreshOrders(setOrders, auth.token);
        }
        return prevOrders;
    });
};

export const refreshOrders = async (
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
    token: string,
    filter?: FilterType
) => {
    try {
        const res = await (window as any).electronAPI.getOrdersByFilter(
            token,
            filter
        );
        if (!res.status) {
            showToast.error("Error fetching orders");
            return;
        }
        setOrders(res.data || []);
    } catch (error) {
        console.error("Error refreshing orders:", error);
        showToast.error("Error fetching orders");
    }
};

export const ComplementsToString = (complements: any[]) => {
    if (complements.length === 0) return "";
    let result = complements.map(c => `${c.groupId}|${c.groupName}|${c.itemId}|${c.itemName}|${c.price}`).join('=');
    return result;
};