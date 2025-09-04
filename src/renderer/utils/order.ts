import { Order } from "@/types/order";
import { showToast } from "./utils";
import { AuthState } from "@/types/user";

interface HandleOrderChangeArgs {
    change: any;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    auth: AuthState;
}

export const handleOrderChange = ({
    change,
    setOrders,
    auth,
}: HandleOrderChangeArgs) => {
    console.log("Database change received:", change);
    if (change.deleted) {
        // Handle deletion
        setOrders((prevOrders) => {
            const deletedOrder = prevOrders.find(
                (order) => order.id === change.id
            );
            if (deletedOrder) {
                showToast.error(
                    `Order#${deletedOrder.orderId || "N/A"} deleted`
                );
            }
            return prevOrders.filter((order) => order.id !== change.id);
        });
    } else if (change.doc) {
        const revisionNumber = parseInt(change.doc._rev.split("-")[0]);
        const isNewOrder = revisionNumber === 1;

        setOrders((prevOrders) => {
            const existingIndex = prevOrders.findIndex(
                (order) => order.id === change.id
            );

            if (existingIndex !== -1) {
                if (!isNewOrder) {
                    // Update existing order
                    const updatedOrders = [...prevOrders];
                    updatedOrders[existingIndex] = change.doc;
                    showToast.success(
                        `Order#${change.doc.orderId || "N/A"} updated, status: ${change.doc.status}`
                    );
                    return updatedOrders;
                } else {
                    // This shouldn't happen - new order with existing ID
                    console.warn(
                        "New order revision but order already exists:",
                        change.id
                    );
                    return prevOrders;
                }
            } else {
                if (isNewOrder) {
                    // Add new order
                    showToast.success(
                        `Order#${change.doc.orderId || "N/A"} sent to kitchen`
                    );
                    return [...prevOrders, change.doc];
                } else {
                    // Order doesn't exist locally but isn't new - fetch all orders to sync
                    console.warn(
                        "Order update received for non-existing order:",
                        change.id
                    );
                    (window as any).electronAPI
                        .getOrders(auth.token)
                        .then((allOrders: Order[]) => {
                            setOrders(allOrders);
                        })
                        .catch((error: any) => {
                            console.error("Error syncing orders:", error);
                        });
                    return prevOrders;
                }
            }
        });
    } else {
        // Fallback: refresh all orders
        console.warn("Unexpected change format, refreshing all orders");
        (window as any).electronAPI
            .getOrders(auth.token)
            .then((allOrders: Order[]) => {
                setOrders(allOrders);
            })
            .catch((error: any) => {
                console.error("Error refreshing orders:", error);
                showToast.error("Error fetching orders");
            });
    }
};

export const refreshOrders = async (setOrders: React.Dispatch<React.SetStateAction<Order[]>>, token: string) => {
    try {
      const results = await (window as any).electronAPI.getOrders(token);
      setOrders(results);
    } catch (error) {
      console.error("Error refreshing orders:", error);
      showToast.error("Error fetching orders");
    }
  };