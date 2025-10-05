import React, { useState, useMemo } from "react";
import { Order, FilterType } from "@/types/order";
import { formatAddress } from "../utils/utils";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import { calculateOrderTotal } from "../utils/orderCalculations";

// ICONS
import SearchIcon from "../assets/icons/search.svg?react";
import PersonIcon from "../assets/icons/person.svg?react";
import EyeIcon from "../assets/icons/eye.svg?react";
import DocumentIcon from "../assets/icons/document.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";

interface ManageOrdersViewProps {
  orders: Order[];
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
  refreshOrdersCallback,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedDate: null,
    selectedDeliveryPerson: "",
    selectedStatus: [],
  });

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
    setPaymentAmount(calculateOrderTotal(order.items || []).toFixed(2));
    setSelectedDeliveryPerson(order.deliveryPerson?.id || "");
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    // TODO: Implement view order functionality
    console.log("View order:", order.id);
  };

  const handlePrintOrder = (order: Order) => {
    // TODO: Implement print order functionality
    console.log("Print order:", order.id);
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
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search Input */}
          <div className="w-full lg:w-80">
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
                placeholder="Search by order number..."
                otherClasses="w-full"
                inputClasses="pl-10 py-2.5"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full lg:w-48">
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            />
          </div>

          {/* Delivery Person Filter */}
          <div className="w-full lg:w-48">
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
          <div className="w-full lg:w-48">
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

          {/* Clear Filters Button */}
          <div className="w-full lg:w-auto">
            <button
              onClick={clearFilters}
              className="w-full lg:w-auto px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
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
                      <div className="flex items-center space-x-2">
                        {/* View Order Button */}
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View Order"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>

                        {/* Print Order Button */}
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Print Order"
                        >
                          <DocumentIcon className="w-4 h-4" />
                        </button>

                        {/* Process Payment Button */}
                        <button
                          onClick={() => handlePaymentClick(order)}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          title="Process Payment"
                        >
                          <ThunderIcon className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ThunderIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Process Payment
                  </h2>
                  <p className="text-sm text-gray-600">
                    Complete the payment for this order
                  </p>
                </div>
              </div>
              <button
                onClick={closePaymentModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Order Details
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      Order ID
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      #{selectedOrderForPayment.orderId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      Customer
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedOrderForPayment.customer.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      €
                      {calculateOrderTotal(
                        selectedOrderForPayment.items || []
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Person Selection */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <PersonIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Select Delivery Person
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "Choose a delivery person..." },
                    ...deliveryPersons.map((person) => ({
                      value: person.id,
                      label: person.name,
                    })),
                  ]}
                  value={selectedDeliveryPerson}
                  onChange={setSelectedDeliveryPerson}
                  placeholder="Choose a delivery person..."
                  className="w-full"
                />
              </div>

              {/* Payment Amount */}
              <CustomInput
                label="Payment Amount"
                name="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                preLabel="€"
                otherClasses="w-full"
                inputClasses="pl-8 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Payment Method */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg
                    className="w-4 h-4 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      paymentMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700 shadow-md"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      <div className="font-semibold text-sm">Cash</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      paymentMethod === "card"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="font-semibold text-sm">Card</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="text-sm text-gray-500">
                {!selectedDeliveryPerson || !paymentAmount ? (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Please fill all required fields
                  </span>
                ) : (
                  <span className="flex items-center text-green-600">
                    <svg
                      className="w-4 h-4 mr-1"
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
                    Ready to process payment
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closePaymentModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyPayment}
                  disabled={!selectedDeliveryPerson || !paymentAmount}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <ThunderIcon className="w-4 h-4" />
                  <span>Process Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
