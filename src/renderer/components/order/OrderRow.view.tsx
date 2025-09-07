import { Order } from "@/types/order";

// ICONS
import EyeIcon from "../../assets/icons/eye.svg?react";
import EditIcon from "../../assets/icons/edit.svg?react";
import CancelIcon from "../../assets/icons/cross.svg?react";
import DeleteIcon from "../../assets/icons/delete.svg?react";

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
                            <EyeIcon className="size-6"/>
                        </button>
                        <button
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onEdit(order)}
                            title="Edit Order"
                        >
                            <EditIcon className="size-6"/>
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <button
                            className="text-orange-600 hover:text-orange-900 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onCancel(order.id)}
                            title="Cancel Order"
                        >
                            <CancelIcon className="size-6"/>
                        </button>
                        <button
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
                            onClick={() => onDelete(order.id)}
                            title="Delete Order"
                        >
                            <DeleteIcon className="size-6"/>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};
