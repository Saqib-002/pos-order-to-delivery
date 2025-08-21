import { useEffect, useState, useRef } from "react";
import { Order } from "@/types/order";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

interface OrderViewProps {
  setIsAddOrderModelShown: React.Dispatch<React.SetStateAction<boolean>>;
}

export const OrderView: React.FC<OrderViewProps> = ({
  setIsAddOrderModelShown,
}: OrderViewProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] =
    useState<boolean>(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const results = await (window as any).electronAPI.getOrders();
      setOrders(results);
    };
    fetchOrders();
    const handleChange = (change: any) => {
      if (change.doc) {
        setOrders((prevOrders) => {
          const updatedOrders = [...prevOrders];
          const index = updatedOrders.findIndex(
            (order) => order._id === change.id
          );
          if (index !== -1) {
            // Update existing order
            updatedOrders[index] = change.doc;
          } else if (!change.deleted) {
            // Add new order
            updatedOrders.push(change.doc);
          } else {
            // Remove deleted order
            return updatedOrders.filter((order) => order._id !== change.id);
          }
          return updatedOrders;
        });
      } else if (change.deleted) {
        // Handle deletion when doc is not included
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== change.id)
        );
      } else {
        // Fallback: refresh all orders
        (window as any).electronAPI
          .getOrders()
          .then((result: any) => {
            setOrders(result.rows.map((row: any) => row.doc));
          })
          .catch(() => {
            toast.error("Error fetching orders");
          });
      }
    };

    // Register change listener and get cleanup function
    const cleanup = (window as any).electronAPI.onDbChange(handleChange);

    // Cleanup listener on unmount
    return () => {
      cleanup();
    };
  }, []);

  // Filter orders based on search term, date, and status
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer.phone.includes(searchTerm) ||
          order._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt || order._id);
        return orderDate.toDateString() === selectedDate.toDateString();
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (order) => order.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, selectedDate, selectedStatus]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        // Check if the click is not on the portal dropdown
        const target = event.target as Element;
        if (!target.closest(".status-dropdown-portal")) {
          setIsStatusDropdownOpen(false);
        }
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const handleDeleteOrder= (id: string) => {
    (window as any).electronAPI.deleteOrder(id).then(()=>{
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== id));
      toast.success("Order deleted successfully!");
    }).catch(() => {
      toast.error("Error deleting order");
    });

  }

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
    <div className="mt-4 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Orders Management
              </h2>
              <p className="text-gray-600 mt-1">
                Manage and track all restaurant orders
              </p>
            </div>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer hover:scale-105"
              type="button"
              onClick={() => setIsAddOrderModelShown(true)}
            >
              <svg
                viewBox="0 0 24 24"
                width={20}
                height={20}
                className="fill-current text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44771 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8Z" />
              </svg>
              Add New Order
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredOrders.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Sent to Kitchen
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredOrders.filter(
                      (o) => o.status.toLowerCase() === "sent to kitchen"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Ready for Delivery
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredOrders.filter(
                      (o) => o.status.toLowerCase() === "ready for delivery"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredOrders.filter(
                      (o) => o.status.toLowerCase() === "delivered"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                All Orders
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      console.log(
                        "Dropdown button clicked, current state:",
                        isStatusDropdownOpen
                      );
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    }}
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors duration-200"
                  >
                    <span className="text-gray-900">
                      {selectedStatus === "all"
                        ? "All Statuses"
                        : selectedStatus === "sent to kitchen"
                          ? "Sent to Kitchen"
                          : selectedStatus === "ready for delivery"
                            ? "Ready for Delivery"
                            : selectedStatus === "out for delivery"
                              ? "Out for Delivery"
                              : selectedStatus === "delivered"
                                ? "Delivered"
                                : selectedStatus === "cancelled"
                                  ? "Cancelled"
                                  : "All Statuses"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isStatusDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Date Picker */}
                <div className="relative">
                  <input
                    type="date"
                    value={
                      selectedDate
                        ? selectedDate.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedDate(
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedDate || selectedStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate(null);
                      setSelectedStatus("all");
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order._id}
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
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {order.customer.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[250px]">
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
                      <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end min-w-[120px]">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105">
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
                        <button className="text-red-600 hover:text-red-900 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105" onClick={() => handleDeleteOrder(order._id)}>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Portal Dropdown for Status Filter */}
      {isStatusDropdownOpen &&
        statusDropdownRef.current &&
        createPortal(
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto status-dropdown-portal"
            style={{
              top: statusDropdownRef.current.getBoundingClientRect().bottom + 4,
              left: statusDropdownRef.current.getBoundingClientRect().left,
              width: statusDropdownRef.current.getBoundingClientRect().width,
              minWidth: "200px",
            }}
          >
            {[
              { value: "all", label: "All Statuses" },
              { value: "sent to kitchen", label: "Sent to Kitchen" },
              { value: "ready for delivery", label: "Ready for Delivery" },
              { value: "out for delivery", label: "Out for Delivery" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Dropdown option clicked:", option.value);
                  setSelectedStatus(option.value);
                  setIsStatusDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-500 hover:text-white transition-colors duration-150 ${
                  selectedStatus === option.value
                    ? "bg-indigo-100 text-indigo-900 font-medium"
                    : "text-gray-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
