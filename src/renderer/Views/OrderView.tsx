import { useEffect, useState } from "react";
import { Order } from "@/types/order";

interface OrderViewProps {
    setIsAddOrderModelShown: React.Dispatch<React.SetStateAction<boolean>>;
}

export const OrderView: React.FC<OrderViewProps> = ({
    setIsAddOrderModelShown,
}: OrderViewProps) => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            const results = await (window as any).electronAPI.getOrders();
            setOrders(results);
        };
        fetchOrders();
        const handleChange = (change: any) => {
            if (change.doc) {
                setOrders((prevOrders) => {
                    const updatedOrders = [...prevOrders];
                    const index = updatedOrders.findIndex(
                        (order) => order._id === change.id
                    );
                    if (index !== -1) {
                        // Update existing order
                        updatedOrders[index] = change.doc;
                    } else if (!change.deleted) {
                        // Add new order
                        updatedOrders.push(change.doc);
                    } else {
                        // Remove deleted order
                        return updatedOrders.filter(
                            (order) => order._id !== change.id
                        );
                    }
                    return updatedOrders;
                });
            } else if (change.deleted) {
                // Handle deletion when doc is not included
                setOrders((prevOrders) =>
                    prevOrders.filter((order) => order._id !== change.id)
                );
            } else {
                // Fallback: refresh all orders
                (window as any).electronAPI
                    .getOrders()
                    .then((result: any) => {
                        setOrders(result.rows.map((row: any) => row.doc));
                    })
                    .catch((err: any) => {
                        console.error("Error refreshing orders:", err);
                    });
            }
        };

        // Register change listener and get cleanup function
        const cleanup = (window as any).electronAPI.onDbChange(handleChange);

        // Cleanup listener on unmount
        return () => {
            cleanup();
        };
    }, []);
    return (
        <div className="mt-4 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl mb-4">All Orders</h2>
                <button
                    className="bg-indigo-500 p-2 cursor-pointer rounded hover:bg-indigo-600 transition-colors duration-150 ease"
                    type="button"
                    onClick={() => setIsAddOrderModelShown(true)}
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="fill-current text-slate-100 size-6"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44771 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8Z" />
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM3.00683 12C3.00683 16.9668 7.03321 20.9932 12 20.9932C16.9668 20.9932 20.9932 16.9668 20.9932 12C20.9932 7.03321 16.9668 3.00683 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12Z"
                        />
                    </svg>
                </button>
            </div>
            <div className="flex gap-6 w-full flex-wrap">
                {orders.map((order) => (
                    <div key={order._id} className="mb-2 p-4 border-t-3 border-indigo-500 rounded bg-white shadow min-w-xs">
                        <div className="flex justify-between items-center">
                            <p>{order.customer.name}</p>
                            <span>{order.status}</span>
                        </div>
                        <div>
                            <p>
                                <strong>id:</strong> {order._id.slice(16, 24)}
                            </p>
                            <p>
                                <strong>Phone:</strong> {order.customer.phone}
                            </p>
                            <p>
                                <strong>Address:</strong>{" "}
                                {order.customer.address}
                            </p>
                        </div>
                        <div>
                            <h4>Order:</h4>
                            <ul>
                                {order.items.map((item, index) => (
                                    <li key={index}>
                                        {item.quantity}x {item.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
