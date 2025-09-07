import { useEffect, useState } from "react";
import { Order } from "@/types/order";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ReportViewProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export const ReportView: React.FC<ReportViewProps> = ({orders,setOrders}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState("today"); // today, week, month, custom

  const getFilteredOrders = () => {
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);

    switch (dateRange) {
      case "today":
        return orders.filter((order) => {
          const orderDate = new Date(order.id);
          return orderDate.toDateString() === today.toDateString();
        });
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orders.filter((order) => {
          const orderDate = new Date(order.id);
          return orderDate >= weekAgo && orderDate <= today;
        });
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orders.filter((order) => {
          const orderDate = new Date(order.id);
          return orderDate >= monthAgo && orderDate <= today;
        });
      case "custom":
        return orders.filter((order) => {
          const orderDate = new Date(order.id);
          return orderDate.toDateString() === selectedDateObj.toDateString();
        });
      default:
        return orders.filter((order) => {
          const orderDate = new Date(order.id);
          return orderDate.toDateString() === selectedDateObj.toDateString();
        });
    }
  };

  const filteredOrders = getFilteredOrders();

  // Calculate statistics
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(
    (order) => order.status.toLowerCase() === "delivered"
  ).length;
  const inKitchenOrders = filteredOrders.filter(
    (order) => order.status.toLowerCase() === "sent to kitchen"
  ).length;
  const readyForDeliveryOrders = filteredOrders.filter(
    (order) => order.status.toLowerCase() === "ready for delivery"
  ).length;
  const outForDeliveryOrders = filteredOrders.filter(
    (order) => order.status.toLowerCase() === "out for delivery"
  ).length;
  const cancelledOrders = filteredOrders.filter(
    (order) => order.status.toLowerCase() === "cancelled"
  ).length;

  // Calculate delivery time statistics
  const deliveryTimes = filteredOrders
    .filter((order) => order.status.toLowerCase() === "delivered")
    .map((order) => {
      const orderTime = new Date(order.id);
      const deliveredTime = new Date(order.id); // Using order time as approximation
      return (deliveredTime.getTime() - orderTime.getTime()) / (1000 * 60); // in minutes
    });

  const avgDeliveryTime =
    deliveryTimes.length > 0
      ? Math.round(
          deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        )
      : 0;

  // Get status distribution for pie chart
  const statusDistribution = [
    { status: "Delivered", count: deliveredOrders, color: "bg-green-500" },
    { status: "In Kitchen", count: inKitchenOrders, color: "bg-orange-500" },
    {
      status: "Ready for Delivery",
      count: readyForDeliveryOrders,
      color: "bg-yellow-500",
    },
    {
      status: "Out for Delivery",
      count: outForDeliveryOrders,
      color: "bg-blue-500",
    },
    { status: "Cancelled", count: cancelledOrders, color: "bg-red-500" },
  ].filter((item) => item.count > 0);

  // Get hourly order distribution for bar chart
  const getHourlyDistribution = () => {
    const hourlyData = new Array(24).fill(0);
    filteredOrders.forEach((order) => {
      const orderTime = new Date(order.id);
      const hour = orderTime.getHours();
      hourlyData[hour]++;
    });
    return hourlyData;
  };

  const hourlyDistribution = getHourlyDistribution();

  // Chart.js configuration for hourly distribution
  const hourlyChartData = {
    labels: Array.from(
      { length: 24 },
      (_, i) => `${i.toString().padStart(2, "0")}:00`
    ),
    datasets: [
      {
        label: "Orders",
        data: hourlyDistribution,
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `Orders: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
    elements: {
      bar: {
        backgroundColor: hourlyDistribution.some((h) => h > 0)
          ? "rgba(99, 102, 241, 0.8)"
          : "rgba(156, 163, 175, 0.5)",
        hoverBackgroundColor: "rgba(99, 102, 241, 1)",
      },
    },
  };

  // Get top items for bar chart
  const getTopItems = () => {
    const itemCounts: { [key: string]: number } = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  };

  const topItems = getTopItems();

  return (
    <div className="mt-4 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Analytics & Reports
              </h2>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into order performance and trends
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period
              </label>
              <div className="flex flex-wrap gap-2">
                {["today", "week", "month", "custom"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      dateRange === range
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {dateRange === "custom" && (
              <div className="flex items-end">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-gray-900">
                  {deliveredOrders}
                </p>
                <p className="text-sm text-gray-500">
                  {totalOrders > 0
                    ? Math.round((deliveredOrders / totalOrders) * 100)
                    : 0}
                  % success rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-orange-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg Delivery Time
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {avgDeliveryTime}m
                </p>
                <p className="text-sm text-gray-500">minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {inKitchenOrders + outForDeliveryOrders}
                </p>
                <p className="text-sm text-gray-500">kitchen + delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status Distribution
            </h3>
            <div className="space-y-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${item.color} mr-3`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">
                      {item.count}
                    </span>
                    <span className="text-sm text-gray-500">
                      (
                      {totalOrders > 0
                        ? Math.round((item.count / totalOrders) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              ))}
              {statusDistribution.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders in selected period
                </div>
              )}
            </div>
          </div>

          {/* Hourly Order Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hourly Order Distribution
            </h3>
            <div className="h-64">
              {hourlyDistribution.some((h) => h > 0) ? (
                <Bar data={hourlyChartData} options={hourlyChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-sm">No orders in selected period</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Items Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Ordered Items
          </h3>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="w-8 text-sm font-medium text-gray-600">
                  #{index + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700">
                  {item.name}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${topItems.some((t) => t.count > 0) ? (item.count / Math.max(...topItems.map((t) => t.count))) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-12 text-sm font-bold text-gray-900">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
            {topItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items ordered in selected period
              </div>
            )}
          </div>
        </div>

        {/* Detailed Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Details
            </h3>
          </div>

          {filteredOrders.length === 0 ? (
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
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your date range or period selection.
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.slice(0, 20).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(16, 24)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-gray-900 font-medium">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status.toLowerCase() === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status.toLowerCase() === "sent to kitchen"
                                ? "bg-orange-100 text-orange-800"
                                : order.status.toLowerCase() ===
                                    "out for delivery"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status.toLowerCase() === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.id).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.id).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length > 20 && (
                <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  Showing first 20 orders of {filteredOrders.length} total
                  orders
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
