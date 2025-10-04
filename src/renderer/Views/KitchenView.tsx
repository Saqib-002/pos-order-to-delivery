import { useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { FilterControls } from "../components/shared/FilterControl.order";
import { Order, FilterType } from "@/types/order";
import { StatsCard } from "../components/shared/StatsCard.order";
import SentToKitchenIcon from "../assets/icons/sent-to-kitchen.svg?react"


// ICONS
import TotalOrdersIcon from "../assets/icons/total-orders.svg?react";
import HighPriorityIcon from "../assets/icons/high-priority.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";
import MarkIcon from "../assets/icons/mark.svg?react";

import { useAuth } from "../contexts/AuthContext";
import { updateOrder } from "../utils/order";
import Header from "../components/shared/Header.order";
import { formatAddress } from "../utils/utils";
import { OrderTable } from "../components/shared/OrderTable";

interface KitchenViewProps {
    orders: Order[];
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
    refreshOrdersCallback: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
    orders,
    filter,
    setFilter,
    refreshOrdersCallback,
}) => {
    const { auth: { token } } = useAuth();
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
                const res = await updateOrder(token, id, { status: "ready for delivery", readyAt: new Date(Date.now()).toISOString() });
                if (!res) {
                    toast.error("Failed to update order");
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
                icon: <TotalOrdersIcon className="size-6 text-blue-600" />,
                bgColor: "bg-blue-100",
                textColor: "text-blue-600",
            },
            {
                title: "High Priority",
                value: highPriorityCount,
                icon: <HighPriorityIcon className="w-6 h-6 text-red-600" />,
                bgColor: "bg-red-100",
                textColor: "text-red-600",
            },
            {
                title: "Avg Prep Time",
                value: "~25 min",
                icon: <ThunderIcon className="w-6 h-6 text-green-600" />,
                bgColor: "bg-green-100",
                textColor: "text-green-600",
            },
        ];
    }, [orders]);

    const hasKitchenOrders = orders.some(
        (o) => o.status.toLowerCase() === "sent to kitchen"
    );
    const getPriorityLabel = (diffMinutes: number) => {
        if (diffMinutes > 120)
            return { label: "High", color: "bg-red-100 text-red-800" };
        if (diffMinutes > 60)
            return { label: "Medium", color: "bg-orange-100 text-orange-800" };
        return { label: "Low", color: "bg-blue-100 text-blue-800" };
    };
    const getPriorityColor = (order: Order) => {
        const orderTime = new Date(order.createdAt || order.id);
        const now = new Date();
        const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

        if (diffHours > 2) return "border-red-500 bg-red-50";
        if (diffHours > 1) return "border-orange-500 bg-orange-50";
        return "border-blue-500 bg-blue-50";
    };
    const OrderRowRenderer = (order: Order) => {
        const orderTime = new Date(order.createdAt || "");
        const now = new Date();
        const diffMinutes = Math.floor(
            (now.getTime() - orderTime.getTime()) / (1000 * 60)
        );
        const timeInKitchen = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
        const { label, color } = getPriorityLabel(diffMinutes);
        return (
            <tr
                className={`hover:bg-gray-50 transition-colors duration-150 ${getPriorityColor(order)}`}
                key={order.id}
            >
                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
                    >
                        {label}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer.phone}
                </td>
                <td className="px-6 py-4 min-w-[250px] text-sm text-gray-900 max-w-xs">
                    {formatAddress(order.customer.address)}
                </td>
                <td className="px-6 py-4 min-w-[250px] text-sm text-gray-900">
                    <div className="space-y-1">
                        {order.items && order.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span className="text-gray-600">{item.productName}</span>
                                <span className="text-gray-900 font-medium">
                                    x{item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{timeInKitchen}</div>
                    <div className="text-xs text-gray-500">
                        {orderTime.toLocaleTimeString()}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end min-w-[120px]">
                    <button
                        onClick={() => markAsReady(order.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
                    >
                        <MarkIcon className="size-4" />
                        Mark Ready
                    </button>
                </td>
            </tr>
        );
    };
    return (
        <div className="mt-4 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[98%] mx-auto">
                <Header title="Kitchen Management" subtitle="Monitor and manage orders in preparation" icon={<SentToKitchenIcon className="text-orange-600 size-8" />} iconbgClasses="bg-orange-100" />
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
                    <OrderTable
                        orders={orders}
                        title={hasKitchenOrders
                            ? "No orders match your search"
                            : "No orders in kitchen"}
                        subtitle={hasKitchenOrders
                            ? "Try adjusting your search criteria or date filter."
                            : "All orders are ready or completed."}
                        columns={[
                            "Priority",
                            "Order ID",
                            "Customer",
                            "Contact",
                            "Address",
                            "Items",
                            "Time in Kitchen",
                            "Actions",
                        ]}
                        renderRow={OrderRowRenderer}
                    />
                </div>
            </div>
        </div>
    );
};

