import { Order } from "@/types/order";
import { JSX } from "react";

// ICONS
import DeliveredIcon from "../../assets/icons/delivered.svg?react";

export const OrderTable: React.FC<{
    orders: Order[];
    title: string;
    columns: string[];
    renderRow: (order: Order) => JSX.Element;
}> = ({ orders, title, columns, renderRow }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {orders.length === 0 ? (
            <div className="text-center py-12">
                <DeliveredIcon className="mx-auto size-12 text-gray-400"/>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No orders {title.toLowerCase()}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {title === "Ready for Delivery Orders"
                        ? "All orders are either in kitchen or already assigned for delivery."
                        : "Try adjusting your search criteria or date filter."}
                </p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(renderRow)}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);
