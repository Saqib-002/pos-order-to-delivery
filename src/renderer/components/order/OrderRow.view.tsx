import { Order } from "@/types/order";

export const OrderRow: React.FC<{
    order: Order;
    onView: (order: Order) => void;
    onEdit: (order: Order) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    status: string;
}> = ({ order, onView, onEdit, onCancel, onDelete, status }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "sent to kitchen":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "ready for delivery":
                return "bg-green-100 text-green-800 border-green-200";
            case "out for delivery":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "delivered":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "cancelled":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    return (
        <tr className="hover:bg-gray-50 transition-colors duration-150">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    #{order.orderId}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {order.customer.name}
                </div>
                <div className="text-sm text-gray-500">
                    {order.customer.phone}
                </div>
            </td>
            <td className="px-6 py-4 min-w-[300px]">
                <div
                    className="text-sm text-gray-900 max-w-xs truncate"
                    title={order.customer.address}
                >
                    {order.customer.address}
                </div>
            </td>
            <td className="px-6 py-4 min-w-[350px]">
                <div className="text-sm text-gray-900">
                    <div className="space-y-2">
                        {order.items.map((item, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-start"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-600 font-medium truncate">
                                        {item.name}
                                    </div>
                                    {item.ingredients &&
                                        item.ingredients.length > 0 && (
                                            <div className="mt-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.ingredients
                                                        .slice(0, 3)
                                                        .map(
                                                            (
                                                                ingredient,
                                                                ingIndex
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        ingIndex
                                                                    }
                                                                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap"
                                                                >
                                                                    {ingredient}
                                                                </span>
                                                            )
                                                        )}
                                                    {item.ingredients.length >
                                                        3 && (
                                                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                                            +
                                                            {item.ingredients
                                                                .length -
                                                                3}{" "}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                                <span className="text-gray-900 font-medium ml-2 flex-shrink-0">
                                    x{item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}
                >
                    {order.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                {order.deliveryPerson ? (
                    <div className="text-sm">
                        <div className="font-medium text-gray-900">
                            {order.deliveryPerson.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                            {order.deliveryPerson.phone}
                        </div>
                        <div className="text-gray-500 text-xs">
                            {order.deliveryPerson.vehicleType}
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">Not assigned</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium min-w-[200px]">
                <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-1">
                        <button
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onView(order)}
                            title="View Order Details"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        </button>
                        <button
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onEdit(order)}
                            title="Edit Order"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <button
                            className="text-orange-600 hover:text-orange-900 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onCancel(order.id)}
                            title="Cancel Order"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        <button
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onDelete(order.id)}
                            title="Delete Order"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};
