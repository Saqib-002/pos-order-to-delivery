import { useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { EmptyState } from "../components/kitchen/EmptyState.view";
import { HeaderSection } from "../components/kitchen/Header";
import { FilterControls } from "../components/order/FilterControls.view";
import { Order, FilterType } from "@/types/order";
import { StatsCard } from "../components/shared/StatsCard.order";
import { OrderRow } from "../components/kitchen/OrderRow.view";

interface KitchenViewProps {
    orders: Order[];
    token: string | null;
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
    refreshOrdersCallback: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
    orders,
    token,
    filter,
    setFilter,
    refreshOrdersCallback,
}) => {
    useEffect(() => {
        setFilter({
            selectedDate: null,
            searchTerm: "",
            selectedStatus: ["sent to kitchen"],
        });
    }, [token, setFilter]);

    const markAsReady = useCallback(
        async (id: string) => {
            try {
                const res = await (window as any).electronAPI.readyOrder(
                    token,
                    id
                );
                if (!res.status) {
                    toast.error("Failed to ready the order");
                    return;
                }
                refreshOrdersCallback();
                toast.success("Order marked as ready");
            } catch (error) {
                console.error("Failed to update order:", error);
            }
        },
        [token, refreshOrdersCallback]
    );

    const stats = useMemo(() => {
        const highPriorityCount = orders.filter((order) => {
            const orderTime = new Date(order.createdAt || order.id);
            const now = new Date();
            const diffHours =
                (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
            return diffHours > 1;
        }).length;

        return [
            {
                title: "Orders in Kitchen",
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
                title: "High Priority",
                value: highPriorityCount,
                icon: (
                    <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ),
                bgColor: "bg-red-100",
                textColor: "text-red-600",
            },
            {
                title: "Avg Prep Time",
                value: "~25 min",
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                ),
                bgColor: "bg-green-100",
                textColor: "text-green-600",
            },
        ];
    }, [orders]);

    const hasKitchenOrders = orders.some(
        (o) => o.status.toLowerCase() === "sent to kitchen"
    );

    return (
        <div className="mt-4 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[98%] mx-auto">
                <HeaderSection />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Kitchen Orders
                            </h3>
                            <FilterControls
                                filter={filter}
                                setFilter={setFilter}
                            />
                        </div>
                    </div>
                    {orders.length === 0 ? (
                        <EmptyState hasKitchenOrders={hasKitchenOrders} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                                            Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time in Kitchen
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <OrderRow
                                            key={order.id}
                                            order={order}
                                            markAsReady={markAsReady}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
