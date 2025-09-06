import { useEffect, useState } from "react";
import { Order } from "@/types/order";
import { CustomSelect } from "../components/ui/CustomSelect";
import { toast } from "react-toastify";

interface DeliveryViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  token: string | null;
  refreshOrderCallback: () => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  orders,
  setOrders,
  token,
  refreshOrderCallback
}) => {
  const [deliveryPerson, setDeliveryPerson] = useState({
    id:"",
    name:"",
  });
  const [deliveryPersons, setDeliveryPersons] = useState<
    {
      id: string;
      name: string;
      phone: string;
      vehicleType: string;
      licenseNo: string;
    }[]
  >([]);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // Fetch delivery persons on component mount
  useEffect(() => {
    fetchDeliveryPersons();
  }, [token]);

  const fetchDeliveryPersons = async () => {
    try {
      const res = await (window as any).electronAPI.getDeliveryPersons(token);
      if (res.status) {
        setDeliveryPersons(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch delivery persons:", error);
    }
  };

  const getDeliveryPersonOptions = () => {
    return deliveryPersons.map((person) => ({
      value: person.name,
      label: person.name,
    }));
  };

  const getFilteredDeliveryPersons = () => {
    if (!deliveryPerson.name.trim()) return [];
    return deliveryPersons.filter((person) =>
      person.name.toLowerCase().includes(deliveryPerson.name.toLowerCase())
    );
  };

  const handleDeliveryPersonChange = ({id,name}: {id: string, name: string}) => {
    setDeliveryPerson({id,name});
    setShowDeliverySuggestions(name.trim().length > 0);
  };
  const selectDeliveryPerson = ({id,name}: {id: string, name: string}) => {
    setDeliveryPerson({id,name});
    setShowDeliverySuggestions(false);
  };

  // Filter orders based on search term and date
  useEffect(() => {
    let filtered = orders.filter(
      (order) => order.status.toLowerCase() === "ready for delivery"
    );

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer.phone.includes(searchTerm) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt || order.id);
        return orderDate.toDateString() === selectedDate.toDateString();
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, selectedDate]);

  const assignDelivery = async (order: Order) => {
    if (!deliveryPerson.name.trim()) {
      alert("Please enter delivery person name");
      return;
    }
    try {
      const res= await (window as any).electronAPI.assignDeliveryPerson(token,order.id,deliveryPerson.id);
      if (!res.status) {
        toast.error("Failed to assign delivery person");
        return;
      }
      refreshOrderCallback();
      setDeliveryPerson({id:"",name:""});
    } catch (error) {
      console.error("Failed to assign delivery:", error);
      alert("Failed to assign delivery. Please try again.");
    }
  };

  const markAsDelivered = async (order: Order) => {
    try {
      const updatedOrder = { ...order, status: "Delivered" };
      await (window as any).electronAPI.updateOrder(token, updatedOrder);
      setOrders(orders.map((o) => (o.id === order.id ? updatedOrder : o)));
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      alert("Failed to mark as delivered. Please try again.");
    }
  };
  // const getDeliveryStatusColor = (status: string) => {
  //   switch (status.toLowerCase()) {
  //     case "ready for pickup":
  //       return "bg-green-100 text-green-800 border-green-200";
  //     case "out for delivery":
  //       return "bg-blue-100 text-blue-800 border-blue-200";
  //     case "delivered":
  //       return "bg-gray-100 text-gray-800 border-gray-200";
  //     default:
  //       return "bg-gray-100 text-gray-800 border-gray-200";
  //   }
  // };

  return (
    <div className="mt-4 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Delivery Management
              </h2>
              <p className="text-gray-600 mt-1">
                Assign and track order deliveries
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Ready for Delivery
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    orders.filter(
                      (o) => o.status.toLowerCase() === "ready for delivery"
                    ).length
                  }
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Out for Delivery
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    orders.filter(
                      (o) => o.status.toLowerCase() === "out for delivery"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Delivered Today
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    orders.filter((o) => {
                      if (o.status.toLowerCase() !== "delivered") return false;
                      const deliveredDate = new Date(o.id);
                      const today = new Date();
                      return (
                        deliveredDate.toDateString() === today.toDateString()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Drivers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    new Set(
                      orders
                        .filter(
                          (o) => o.status.toLowerCase() === "out for delivery"
                        )
                        .map((o) => o.deliveryPersonId)
                        .filter(Boolean)
                    ).size
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Person Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Delivery Person
              </label>
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
                  placeholder="Search delivery person by name..."
                  value={deliveryPerson.name}
                  onChange={(e) => handleDeliveryPersonChange({id:deliveryPerson.id,name:e.target.value})}
                  onFocus={() =>
                    setShowDeliverySuggestions(deliveryPerson.name.trim().length > 0)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowDeliverySuggestions(false), 200)
                  }
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
                />

                {/* Suggestions Dropdown */}
                {showDeliverySuggestions &&
                  getFilteredDeliveryPersons().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredDeliveryPersons().map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => selectDeliveryPerson({id:person.id,name:person.name})}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {person.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {person.phone} • {person.vehicleType}
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                {person.licenseNo}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
            <div className="flex items-end justify-end">
              <button
                onClick={() => {
                  if (deliveryPerson.name.trim()) {
                    const firstOrder = filteredOrders[0];
                    if (firstOrder) {
                      assignDelivery(firstOrder);
                    }
                  }
                }}
                disabled={!deliveryPerson.name.trim() || filteredOrders.length === 0}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Quick Assign
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ready for Delivery Orders
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
                {(searchTerm || selectedDate) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate(null);
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {orders.filter(
                  (o) => o.status.toLowerCase() === "ready for delivery"
                ).length === 0
                  ? "No orders ready for delivery"
                  : "No orders match your search"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {orders.filter(
                  (o) => o.status.toLowerCase() === "ready for delivery"
                ).length === 0
                  ? "All orders are either in kitchen or already assigned for delivery."
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ready Since
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const readyTime = new Date(order.id);
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
                            #{order.id.slice(16, 24)}
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
                            <svg
                              className="w-4 h-4"
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
                            Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Out for Delivery Section */}
        {orders.filter((o) => o.status.toLowerCase() === "out for delivery")
          .length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Out for Delivery
              </h3>
            </div>
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
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders
                    .filter(
                      (o) => o.status.toLowerCase() === "out for delivery"
                    )
                    .map((order) => (
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
                          <div className="text-sm text-gray-900 font-medium">
                            {order.deliveryPersonId || "Unassigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end min-w-[120px]">
                          <button
                            onClick={() => markAsDelivered(order)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
                          >
                            <svg
                              className="w-4 h-4"
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
                            Delivered
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
