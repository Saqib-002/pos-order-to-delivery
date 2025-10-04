import { Order } from "@/types/order";
import MarkIcon from "../../assets/icons/mark.svg?react";
import { formatAddress } from "../../utils/utils";

interface OrderRowProps {
  order: Order;
  markAsReady: (id: string) => void;
}
const getPriorityColor = (order: Order) => {
  const orderTime = new Date(order.createdAt || order.id);
  const now = new Date();
  const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

  if (diffHours > 2) return "border-red-500 bg-red-50";
  if (diffHours > 1) return "border-orange-500 bg-orange-50";
  return "border-blue-500 bg-blue-50";
};

const getPriorityLabel = (diffMinutes: number) => {
  if (diffMinutes > 120)
    return { label: "High", color: "bg-red-100 text-red-800" };
  if (diffMinutes > 60)
    return { label: "Medium", color: "bg-orange-100 text-orange-800" };
  return { label: "Low", color: "bg-blue-100 text-blue-800" };
};
export const OrderRow: React.FC<OrderRowProps> = ({ order, markAsReady }) => {
  const orderTime = new Date(order.createdAt || order.id);
  const now = new Date();
  const diffMinutes = Math.floor(
    (now.getTime() - orderTime.getTime()) / (1000 * 60)
  );
  const timeInKitchen = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
  const { label, color } = getPriorityLabel(diffMinutes);

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors duration-150 ${getPriorityColor(order)}`}
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
