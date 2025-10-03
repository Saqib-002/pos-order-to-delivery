import React, { useState, useMemo } from "react";
import { Order, FilterType } from "@/types/order";
import { formatAddress } from "../utils/utils";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";

// ICONS
import SearchIcon from "../assets/icons/search.svg?react";
import PersonIcon from "../assets/icons/person.svg?react";

interface ManageOrdersViewProps {
  orders: Order[];
  token: string | null;
  refreshOrdersCallback: () => void;
}

interface FilterState {
  searchTerm: string;
  selectedDate: Date | null;
  selectedDeliveryPerson: string;
  selectedStatus: string[];
}

export const ManageOrdersView: React.FC<ManageOrdersViewProps> = ({
  orders,
  token,
  refreshOrdersCallback,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedDate: null,
    selectedDeliveryPerson: "",
    selectedStatus: [],
  });

  const [showFilters, setShowFilters] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] =
    useState<Order | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  // Get unique delivery persons from orders
  const deliveryPersons = useMemo(() => {
    const persons = orders
      .filter((order) => order.deliveryPerson)
      .map((order) => ({
        id: order.deliveryPerson!.id,
        name: order.deliveryPerson!.name,
      }))
      .filter(
        (person, index, self) =>
          index === self.findIndex((p) => p.id === person.id)
      );
    return persons;
  }, [orders]);

  // Get unique payment statuses from orders
  const paymentStatuses = useMemo(() => {
    const statuses = orders.map((order) => order.paymentType || "pending");
    return [...new Set(statuses)];
  }, [orders]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search by order number
      if (filters.searchTerm) {
        const orderNumber = `K${order.orderId}`;
        if (
          !orderNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())
        ) {
          return false;
        }
      }

      // Filter by date
      if (filters.selectedDate) {
        const orderDate = new Date(order.createdAt);
        const filterDate = new Date(filters.selectedDate);
        if (
          orderDate.getDate() !== filterDate.getDate() ||
          orderDate.getMonth() !== filterDate.getMonth() ||
          orderDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }

      // Filter by delivery person
      if (filters.selectedDeliveryPerson) {
        if (
          !order.deliveryPerson ||
          order.deliveryPerson.id !== filters.selectedDeliveryPerson
        ) {
          return false;
        }
      }

      // Filter by payment status
      if (filters.selectedStatus.length > 0) {
        const paymentStatus = order.paymentType || "pending";
        if (!filters.selectedStatus.includes(paymentStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filters]);

  const getPaymentStatusColor = (paymentType: string) => {
    switch (paymentType?.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800 border-green-200";
      case "card":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedDate: null,
      selectedDeliveryPerson: "",
      selectedStatus: [],
    });
  };

  const handlePaymentClick = (order: Order) => {
    setSelectedOrderForPayment(order);
    setPaymentAmount(
      order.items
        .reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
        .toFixed(2)
    );
    setSelectedDeliveryPerson(order.deliveryPerson?.id || "");
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);
  };

  const handleApplyPayment = async () => {
    if (!selectedOrderForPayment) return;

    try {
      // API to apply the payment
      console.log("Applying payment:", {
        orderId: selectedOrderForPayment.id,
        deliveryPersonId: selectedDeliveryPerson,
        amount: paymentAmount,
        method: paymentMethod,
      });

      // Close modal and refresh orders
      setIsPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
      refreshOrdersCallback();
    } catch (error) {
      console.error("Error applying payment:", error);
    }
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
    setSelectedDeliveryPerson("");
    setPaymentAmount("");
    setPaymentMethod("cash");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Orders</h1>
        <p className="text-gray-600">
          View and manage all orders with advanced filtering options
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <CustomInput
                label=""
                name="searchTerm"
                type="text"
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
                placeholder="Search by order number (e.g., K001, K002)..."
                otherClasses="w-full"
                inputClasses="pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>🔍</span>
            <span>Filters</span>
            {showFilters ? "▲" : "▼"}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline w-4 h-4 mr-1">📅</span>
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={
                    filters.selectedDate
                      ? filters.selectedDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      selectedDate: e.target.value
                        ? new Date(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Delivery Person Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PersonIcon className="inline w-4 h-4 mr-1" />
                  Delivery Person
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "All Delivery Persons" },
                    ...deliveryPersons.map((person) => ({
                      value: person.id,
                      label: person.name,
                    })),
                  ]}
                  value={filters.selectedDeliveryPerson}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      selectedDeliveryPerson: value,
                    }))
                  }
                  placeholder="All Delivery Persons"
                  className="w-full"
                />
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "All Payment Statuses" },
                    ...paymentStatuses.map((status) => ({
                      value: status,
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                    })),
                  ]}
                  value={filters.selectedStatus[0] || ""}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      selectedStatus: value ? [value] : [],
                    }))
                  }
                  placeholder="All Payment Statuses"
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-lg font-medium mb-2">
                        No orders found
                      </p>
                      <p className="text-sm">
                        {filters.searchTerm ||
                        filters.selectedDate ||
                        filters.selectedDeliveryPerson ||
                        filters.selectedStatus.length > 0
                          ? "Try adjusting your filters to see more results"
                          : "No orders have been created yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      K{order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div
                        className="truncate"
                        title={formatAddress(order.customer.address)}
                      >
                        {formatAddress(order.customer.address)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.orderType?.toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.paymentType || "pending")}`}
                      >
                        {(order.paymentType || "pending")
                          .charAt(0)
                          .toUpperCase() +
                          (order.paymentType || "pending").slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.deliveryPerson ? (
                        <div>
                          <div className="font-medium">
                            {order.deliveryPerson.name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {order.deliveryPerson.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €
                      {order.items
                        .reduce(
                          (total, item) =>
                            total + (item.price || 0) * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePaymentClick(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                        title="Process Payment"
                      >
                        Process Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Process Payment
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  Order Details
                </h3>
                <p className="text-sm text-gray-600">
                  Order #{selectedOrderForPayment.orderId} -{" "}
                  {selectedOrderForPayment.customer.name}
                </p>
                <p className="text-sm text-gray-600">
                  Current Total: €
                  {selectedOrderForPayment.items
                    .reduce(
                      (total, item) =>
                        total + (item.price || 0) * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </p>
              </div>

              {/* Delivery Person Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PersonIcon className="inline w-4 h-4 mr-1" />
                  Select Delivery Person
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "Select Delivery Person" },
                    ...deliveryPersons.map((person) => ({
                      value: person.id,
                      label: person.name,
                    })),
                  ]}
                  value={selectedDeliveryPerson}
                  onChange={setSelectedDeliveryPerson}
                  placeholder="Select Delivery Person"
                  className="w-full"
                />
              </div>

              {/* Payment Amount */}
              <CustomInput
                label="Payment Amount (€)"
                name="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
                preLabel="€"
                otherClasses="w-full"
                inputClasses="pl-8"
              />

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">💵</div>
                    <div className="font-medium text-sm">Cash</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === "card"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">💳</div>
                    <div className="font-medium text-sm">Card</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPayment}
                disabled={!selectedDeliveryPerson || !paymentAmount}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Apply Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
