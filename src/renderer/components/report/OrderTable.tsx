import { AnalyticsType } from "@/types/report";

export const OrderTable: React.FC<{ analytics: AnalyticsType | null }> = ({ analytics }) => {
    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "delivered": return "bg-green-100 text-green-800";
            case "sent to kitchen": return "bg-orange-100 text-orange-800";
            case "out for delivery": return "bg-blue-100 text-blue-800";
            case "cancelled": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            </div>
            {analytics?.orders.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your date range or period selection.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Order ID", "Customer", "Items", "Status", "Time"].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analytics?.orders.slice(0, 20).map((order) => (
                                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.customer.name}</div>
                                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-gray-600">{item.name}</span>
                                                    <span className="text-gray-900 font-medium">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                        <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {analytics?.orders && analytics.orders.length > 20 && (
                        <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
                            Showing first 20 orders of {analytics.orders.length} total orders
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};