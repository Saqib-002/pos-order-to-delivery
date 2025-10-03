import { FilterType, Order } from "@/types/order";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { DeliveryPersonInput } from "../components/delivery/DeliveryPersonInput.view";
import { Header } from "../components/delivery/Header.view";
import { OrderTable } from "../components/delivery/OrderTable";
import { StatsCard } from "../components/shared/StatsCard.order";

// ICONS
import CircleCheckIcon from "../assets/icons/circle-check.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";
import MarkIcon from "../assets/icons/mark.svg?react";
import GroupIcon from "../assets/icons/group.svg?react";
import SearchIcon from "../assets/icons/search.svg?react";
import { useAuth } from "../contexts/AuthContext";


interface DeliveryViewProps {
    orders: Order[];
    refreshOrdersCallback: () => void;
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}
export const DeliveryView: React.FC<DeliveryViewProps> = ({
    orders,
    refreshOrdersCallback,
    filter,
    setFilter,
}) => {
    const {auth:{token}}=useAuth();
    const [deliveryPerson, setDeliveryPerson] = useState<{
        id: string;
        name: string;
    }>({ id: "", name: "" });
    const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(
        []
    );
    const [showDeliverySuggestions, setShowDeliverySuggestions] =
        useState(false);

    useEffect(() => {
        const fetchDeliveryPersons = async () => {
            try {
                const res = await (
                    window as any
                ).electronAPI.getDeliveryPersons(token);
                if (res.status) {
                    setDeliveryPersons(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch delivery persons:", error);
            }
        };

        fetchDeliveryPersons();
        setFilter({
            selectedDate: null,
            searchTerm: "",
            selectedStatus: ["ready for delivery", "out for delivery"],
        });
    }, [token, setFilter]);

    const readyOrders = useMemo(
        () =>
            orders.filter(
                (o) => o.status.toLowerCase() === "ready for delivery"
            ),
        [orders]
    );
    const outForDeliveryOrders = useMemo(
        () =>
            orders.filter((o) => o.status.toLowerCase() === "out for delivery"),
        [orders]
    );

    const assignDelivery = useCallback(
        async (order: Order) => {
            if (!deliveryPerson.name.trim()) {
                toast.error("Please enter delivery person name");
                return;
            }
            try {
                const res = await (
                    window as any
                ).electronAPI.assignDeliveryPerson(
                    token,
                    order.id,
                    deliveryPerson.id
                );
                if (!res.status) {
                    toast.error("Failed to assign delivery person");
                    return;
                }
                refreshOrdersCallback();
                setDeliveryPerson({ id: "", name: "" });
            } catch (error) {
                console.error("Failed to assign delivery:", error);
                toast.error("Failed to assign delivery. Please try again.");
            }
        },
        [deliveryPerson, token, refreshOrdersCallback]
    );

    const markAsDelivered = useCallback(
        async (id: string) => {
            try {
                const res = await (
                    window as any
                ).electronAPI.markDeliveredOrder(token, id);
                if (!res.status) {
                    toast.error("Failed to mark as delivered");
                    return;
                }
                refreshOrdersCallback();
                toast.success("Order marked as delivered");
            } catch (error) {
                console.error("Failed to mark as delivered:", error);
                toast.error("Failed to mark as delivered. Please try again.");
            }
        },
        [token, refreshOrdersCallback]
    );

    const stats = useMemo(
        () => [
            {
                title: "Ready for Delivery",
                value: readyOrders.length,
                icon: <CircleCheckIcon className="size-6 text-green-600"/>,
                bgColor: "bg-green-100",
            },
            {
                title: "Out for Delivery",
                value: outForDeliveryOrders.length,
                icon: <ThunderIcon className="text-blue-600 size-6"/>,
                bgColor: "bg-blue-100",
            },
            {
                title: "Delivered Today",
                value: orders.filter((o) => {
                    if (o.status.toLowerCase() !== "delivered") return false;
                    const deliveredDate = new Date(o.id);
                    const today = new Date();
                    return (
                        deliveredDate.toDateString() === today.toDateString()
                    );
                }).length,
                icon: <MarkIcon className="text-gray-600 size-6"/>,
                bgColor: "bg-gray-100",
            },
            {
                title: "Active Drivers",
                value: new Set(
                    outForDeliveryOrders
                        .map((o) => o.deliveryPersonId)
                        .filter(Boolean)
                ).size,
                icon: <GroupIcon className="text-purple-600 size-6"/>,
                bgColor: "bg-purple-100",
            },
        ],
        [readyOrders, outForDeliveryOrders, orders]
    );
    const renderReadyOrderRow = (order: Order) => {
        const readyTime = new Date(order.readyAt || order.createdAt);
        const now = new Date();
        const diffMinutes = Math.floor(
            (now.getTime() - readyTime.getTime()) / (1000 * 60)
        );
        const readySince = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;

        return (
            <tr
                key={order.id}
                className="hover:bg-gray-50 transition-colors duration-150"
            >
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                        #{order.orderId}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                        {order.customer.name}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                        {order.customer.phone}
                    </div>
                </td>
                <td className="px-6 py-4 min-w-[250px]">
                    <div className="text-sm text-gray-900 max-w-xs">
                        {order.customer.address}
                    </div>
                </td>
                <td className="px-6 py-4 min-w-[250px]">
                    <div className="text-sm text-gray-900">
                        <div className="space-y-1">
                            {order.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between"
                                >
                                    <span className="text-gray-600">
                                        {item.name}
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                        x{item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                        {readySince}
                    </div>
                    <div className="text-xs text-gray-500">
                        {readyTime.toLocaleTimeString()}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2 min-w-[140px]">
                    <button
                        onClick={() => assignDelivery(order)}
                        disabled={!deliveryPerson.name.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
                    >
                        <ThunderIcon className="size-4"/>
                        Assign
                    </button>
                </td>
            </tr>
        );
    };
    const renderOutForDeliveryRow = (order: Order) => (
        <tr
            key={order.id}
            className="hover:bg-gray-50 transition-colors duration-150"
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    #{order.orderId}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {order.customer.name}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs">
                    {order.customer.address}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {order.deliveryPerson ? (
                    <div className="text-sm">
                        <div className="font-medium text-gray-900">
                            {order.deliveryPerson.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                            {order.deliveryPerson.phone} •{" "}
                            {order.deliveryPerson.vehicleType}
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">Unassigned</span>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                    <div className="space-y-1">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span className="text-gray-600">
                                    {item.name}
                                </span>
                                <span className="text-gray-900 font-medium">
                                    x{item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end min-w-[120px]">
                <button
                    onClick={() => markAsDelivered(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
                    <MarkIcon className="size-4"/>
                    Delivered
                </button>
            </td>
        </tr>
    );

    return (
        <div className="mt-4 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[98%] mx-auto">
                <Header />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat) => (
                        <StatsCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            bgColor={stat.bgColor}
                        />
                    ))}
                </div>
                <DeliveryPersonInput
                    deliveryPerson={deliveryPerson}
                    setDeliveryPerson={setDeliveryPerson}
                    deliveryPersons={deliveryPersons}
                    showSuggestions={showDeliverySuggestions}
                    setShowSuggestions={setShowDeliverySuggestions}
                    onAssign={() =>
                        readyOrders[0] && assignDelivery(readyOrders[0])
                    }
                    disabled={
                        !deliveryPerson.name.trim() || readyOrders.length === 0
                    }
                />
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Filters
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="size-5 text-gray-400"/>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={filter.searchTerm}
                                    onChange={(e) =>
                                        setFilter({
                                            ...filter,
                                            searchTerm: e.target.value,
                                        })
                                    }
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <input
                                type="date"
                                value={
                                    filter.selectedDate
                                        ? filter.selectedDate
                                              .toISOString()
                                              .split("T")[0]
                                        : ""
                                }
                                onChange={(e) =>
                                    setFilter({
                                        ...filter,
                                        selectedDate: e.target.value
                                            ? new Date(e.target.value)
                                            : null,
                                    })
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {(filter.searchTerm || filter.selectedDate) && (
                                <button
                                    onClick={() =>
                                        setFilter({
                                            ...filter,
                                            searchTerm: "",
                                            selectedDate: null,
                                        })
                                    }
                                    className="px-3 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <OrderTable
                    orders={readyOrders}
                    title="Ready for Delivery Orders"
                    columns={[
                        "Order ID",
                        "Customer",
                        "Contact",
                        "Address",
                        "Items",
                        "Ready Since",
                        "Actions",
                    ]}
                    renderRow={renderReadyOrderRow}
                />
                {outForDeliveryOrders.length > 0 && (
                    <OrderTable
                        orders={outForDeliveryOrders}
                        title="Out for Delivery"
                        columns={[
                            "Order ID",
                            "Customer",
                            "Address",
                            "Driver",
                            "Items",
                            "Actions",
                        ]}
                        renderRow={renderOutForDeliveryRow}
                    />
                )}
            </div>
        </div>
    );
};
