import { useEffect, useState } from "react";
import { FilterType, Order } from "@/types/order";
import { toast } from "react-toastify";
import { OrderForm } from "../components/order/OrderForm";
import { ViewOrderModal } from "../components/order/ViewOrderModal";
import { FilterControls } from "../components/order/FilterControls.view";
import { OrderHeader } from "../components/order/OrderHeader.view";
import { OrderRow } from "../components/order/OrderRow.view";
import { StatsCard } from "../components/shared/StatsCard.order";

interface OrderViewProps {
    orders: Order[];
    token: string | null;
    refreshOrdersCallback: () => void;
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}
export const OrderView: React.FC<OrderViewProps> = ({
    token,
    orders,
    refreshOrdersCallback,
    filter,
    setFilter,
}) => {
    const [isAddOrderModelShown, setIsAddOrderModelShown] = useState(false);
    const [isViewOrderModalShown, setIsViewOrderModalShown] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const res = await (window as any).electronAPI.getMenuItems(token);
            if (!res.status) {
                toast.error("Unable to get menu items");
                return;
            }
            setMenuItems(res.data);
        } catch (error) {
            toast.error("Failed to fetch menu items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuItems();
        setFilter({
            searchTerm: "",
            selectedDate: null,
            selectedStatus: ["all"],
        });
    }, []);
    const handleDeleteOrder = async (id: string) => {
        if (
            window.confirm(
                "Are you sure you want to delete this order? This action cannot be undone."
            )
        ) {
            try {
                const res = await (window as any).electronAPI.deleteOrder(
                    token,
                    id
                );
                if (!res.status) {
                    toast.error("Error deleting order");
                    return;
                }
                toast.success("Order deleted successfully");
                refreshOrdersCallback();
            } catch (error) {
                toast.error("Error deleting order");
            }
        }
    };

    const handleCancelOrder = async (id: string) => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            try {
                const res = await (window as any).electronAPI.cancelOrder(
                    token,
                    id
                );
                if (!res.status) {
                    toast.error("Error cancelling order");
                    return;
                }
                toast.success("Order cancelled successfully");
                refreshOrdersCallback();
            } catch (error) {
                toast.error("Error cancelling order");
            }
        }
    };

    const statsData = [
        {
            title: "Total Orders",
            value: orders.length,
            icon: (
                <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
            ),
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
        },
        {
            title: "Sent to Kitchen",
            value: orders.filter(
                (o) => o.status.toLowerCase() === "sent to kitchen"
            ).length,
            icon: (
                <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                </svg>
            ),
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
        },
        {
            title: "Ready for Delivery",
            value: orders.filter(
                (o) => o.status.toLowerCase() === "ready for delivery"
            ).length,
            icon: (
                <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            ),
            bgColor: "bg-green-100",
            textColor: "text-green-600",
        },
        {
            title: "Delivered",
            value: orders.filter((o) => o.status.toLowerCase() === "delivered")
                .length,
            icon: (
                <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            ),
            bgColor: "bg-gray-100",
            textColor: "text-gray-600",
        },
    ];

    return (
        <>
            {isAddOrderModelShown && (
                <OrderForm
                    onClose={() => setIsAddOrderModelShown(false)}
                    selectedOrder={selectedOrder}
                    refreshOrders={refreshOrdersCallback}
                    token={token}
                />
            )}
            {isViewOrderModalShown && (
                <ViewOrderModal
                    isOpen={isViewOrderModalShown}
                    onClose={() => setIsViewOrderModalShown(false)}
                    order={selectedOrder}
                />
            )}
            <div className="mt-4 p-6 bg-gray-50 min-h-screen">
                <div className="max-w-[98%] mx-auto">
                    <OrderHeader
                        onAddOrder={() => {
                            setSelectedOrder(null);
                            setIsAddOrderModelShown(true);
                        }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {statsData.map((stat, index) => (
                            <StatsCard key={index} {...stat} />
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    All Orders
                                </h3>
                                <FilterControls
                                    filter={filter}
                                    setFilter={setFilter}
                                />
                            </div>
                        </div>
                        {orders.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {orders.length === 0
                                        ? "No orders"
                                        : "No orders match your search"}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {orders.length === 0
                                        ? "Get started by creating a new order."
                                        : "Try adjusting your search criteria or date filter."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                                Address
                                            </th>
                                            <th className="px-6 py-3 min-w-[250px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                                                Delivery Person
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <OrderRow
                                                key={order.id}
                                                order={order}
                                                onView={(order) => {
                                                    setSelectedOrder(order);
                                                    setIsViewOrderModalShown(
                                                        true
                                                    );
                                                }}
                                                onEdit={(order) => {
                                                    setSelectedOrder(order);
                                                    setIsAddOrderModelShown(
                                                        true
                                                    );
                                                }}
                                                onCancel={handleCancelOrder}
                                                onDelete={handleDeleteOrder}
                                                status={order.status}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
