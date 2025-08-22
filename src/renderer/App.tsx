import { useEffect, useRef, useState } from "react";
import { OrderView } from "@/renderer/Views/OrderView";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";
import { Order } from "@/types/order";
import { toast } from "react-toastify";
import { debounce } from "lodash";

const showSuccessToast = debounce((message: string) => {
    toast.success(message);
}, 1000);
const showErrorToast = debounce((message: string) => {
    toast.error(message);
}, 1000);

const App: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [view, setView] = useState("order");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            const results = await (window as any).electronAPI.getOrders();
            setOrders(results);
        };
        fetchOrders();

        const handleChange = (change: any) => {
            console.log("Database change received:", change);

            if (change.deleted) {
                // Handle deletion
                setOrders((prevOrders) => {
                    const deletedOrder = prevOrders.find(
                        (order) => order._id === change.id
                    );
                    if (deletedOrder) {
                        showErrorToast(
                            `Order#${deletedOrder.orderId || "N/A"} deleted`
                        );
                    }
                    return prevOrders.filter(
                        (order) => order._id !== change.id
                    );
                });
            } else if (change.doc) {
                const revisionNumber = parseInt(change.doc._rev.split("-")[0]);
                const isNewOrder = revisionNumber === 1;

                setOrders((prevOrders) => {
                    const existingIndex = prevOrders.findIndex(
                        (order) => order._id === change.id
                    );

                    if (existingIndex !== -1) {
                        if (!isNewOrder) {
                            // Update existing order
                            const updatedOrders = [...prevOrders];
                            updatedOrders[existingIndex] = change.doc;
                            showSuccessToast(
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
                            showSuccessToast(
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
                                .getOrders()
                                .then((allOrders: Order[]) => {
                                    setOrders(allOrders);
                                })
                                .catch((error: any) => {
                                    console.error(
                                        "Error syncing orders:",
                                        error
                                    );
                                });
                            return prevOrders;
                        }
                    }
                });
            } else {
                // Fallback: refresh all orders
                console.warn("Unexpected change format, refreshing all orders");
                (window as any).electronAPI
                    .getOrders()
                    .then((allOrders: Order[]) => {
                        setOrders(allOrders);
                    })
                    .catch((error: any) => {
                        console.error("Error refreshing orders:", error);
                        toast.error("Error fetching orders");
                    });
            }
        };

        // Register change listener and get cleanup function
        const cleanup = (window as any).electronAPI.onDbChange(handleChange);
        audioRef.current = new Audio("./assets/notification.wav");
        audioRef.current.volume = 0.5;

        // Listen for toast changes
        const unsubscribe = toast.onChange((payload) => {
            if (payload.status === "added") {
                // Play sound when a toast is added
                if (audioRef.current) {
                    audioRef.current.play().catch((error) => {
                        console.error("Error playing sound:", error);
                    });
                }
            }
        });

        // Cleanup listener on unmount
        return () => {
            cleanup();
        };
    }, []);

    const renderView = () => {
        switch (view) {
            case "order":
                return <OrderView orders={orders} setOrders={setOrders} />;
            case "kitchen":
                return <KitchenView orders={orders} setOrders={setOrders} />;
            case "delivery":
                return <DeliveryView orders={orders} setOrders={setOrders} />;
            case "reports":
                return <ReportView orders={orders} setOrders={setOrders} />;
            default:
                return <div>Page Not Found</div>;
        }
    };
    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <nav className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300">
                <div className="flex items-center gap-2">
                    <img
                        src="./assets/logo.png"
                        alt="Logo"
                        className="size-6"
                    />
                    <h1 className="text-2xl font-bold">Delivery System</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "order" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("order")}
                    >
                        Orders
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "kitchen" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("kitchen")}
                    >
                        Kitchen View
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "delivery" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("delivery")}
                    >
                        Delivery View
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "reports" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("reports")}
                    >
                        Reports
                    </button>
                    <button
                        className="mr-2 outline-none p-2 bg-red-500 text-white rounded-lg font-semibold py-2 px-6 shadow-md hover:bg-red-600 transition-colors cursor-pointer duration-150"
                        onClick={() => {}}
                    >
                        LogOut
                    </button>
                </div>
            </nav>
            {renderView()}
        </div>
    );
};

export default App;
