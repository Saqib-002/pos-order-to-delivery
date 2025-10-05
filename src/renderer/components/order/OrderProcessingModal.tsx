import React, { useState, useEffect } from "react";
import CustomerModal from "./modals/CustomerModal";
import PaymentProcessingModal from "./modals/PaymentProcessingModal";
import { toast } from "react-toastify";
import { Order, OrderItem, Customer } from "@/types/order";
import { useAuth } from "@/renderer/contexts/AuthContext";
import {
  calculateOrderTotal,
  calculateTaxPercentage,
} from "@/renderer/utils/orderCalculations";

interface OrderProcessingModalProps {
  onClose: () => void;
  order: Order | null;
  orderItems: OrderItem[];
  onProcessOrder: (orderData: any) => void;
}

const OrderProcessingModal: React.FC<OrderProcessingModalProps> = ({
  onClose,
  orderItems,
  order,
  onProcessOrder,
}) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery" | "dine-in">(
    "pickup"
  );
  const [notes, setNotes] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const {
    auth: { token },
  } = useAuth();

  useEffect(() => {
    setCustomerSearch(order?.customer.name || "");
    setOrderType(order?.orderType || "pickup");
    setNotes(order?.notes || "");
    setSearchResults([]);
    setSelectedCustomer(order?.customer.name ? order.customer : null);
    setIsSearching(false);
    setShowSearchResults(false);
    setIsCustomerModalOpen(false);
  }, []);

  const calculateTotal = () => {
    return calculateOrderTotal(orderItems);
  };
  const formatAddress = (address: string) => {
    if (!address) return "No address provided";
    if (address.includes("|")) {
      return address
        .split("|")
        .map((part) => {
          const [key, value] = part.split("=");
          return value || part;
        })
        .join(", ");
    }

    return address;
  };

  const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm.trim() || !token) return;
    setIsSearching(true);
    try {
      const result = await (window as any).electronAPI.getCustomersByPhone(
        token,
        searchTerm
      );
      if (result.status) {
        setSearchResults(result.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowSearchResults(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleNewCustomerCreated = (newCustomer: Customer) => {
    setSelectedCustomer(newCustomer);
    setCustomerSearch(newCustomer.name);
    setShowSearchResults(false);
    setIsCustomerModalOpen(false);
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch.trim() && customerSearch.length >= 3) {
        searchCustomers(customerSearch);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customerSearch, token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSearchResults && !target.closest(".customer-search-container")) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchResults]);

  const handleProcessOrder = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (orderType === "delivery" && !selectedCustomer.address.trim()) {
      toast.error(
        "Selected customer has no address. Please select a different customer or change to pickup."
      );
      return;
    }

    if (orderType === "dine-in" || orderType === "pickup") {
      setIsPaymentModalOpen(true);
    } else {
      handlePaymentConfirm({
        paymentType: "pending",
        totalAmount: calculateTotal(),
      });
    }
  };

  const handlePaymentConfirm = (paymentData: {
    paymentType: string;
    totalAmount: number;
  }) => {
    if (!selectedCustomer) return;

    const orderData = {
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerCIF: selectedCustomer.cif || "",
      customerEmail: selectedCustomer.email || "",
      customerComments: selectedCustomer.comments || "",
      customerAddress:
        orderType === "delivery"
          ? selectedCustomer.address
          : orderType === "dine-in"
            ? "Dine-in"
            : "In-store",
      orderType,
      paymentType:
        orderType === "delivery" ? "pending" : paymentData.paymentType,
      status: "sent to kitchen",
      notes: notes || `Order total: €${calculateTotal().toFixed(2)}`,
    };
    onProcessOrder(orderData);
    setIsPaymentModalOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modern Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Process Order</h2>
                <p className="text-indigo-100 text-sm">
                  Complete order details
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 touch-manipulation"
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
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 touch-pan-y">
          {/* Customer Search */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Customer Search
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative customer-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Search Customer *
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg touch-manipulation focus:outline-none"
                    placeholder="Type customer name or phone to search..."
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 font-semibold touch-manipulation min-h-[56px]"
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
                  <span>Add New</span>
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectCustomer(customer);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-indigo-50 transition-colors duration-200 touch-manipulation"
                    >
                      <div className="text-base font-semibold text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {customer.phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Card */}
            {selectedCustomer && (
              <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span>Selected Customer</span>
                  </h4>
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors duration-200 touch-manipulation"
                  >
                    Change
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Name, Phone, Email in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600">Name:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600">
                        Phone:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">
                          Email:
                        </span>
                        <span className="text-gray-900 font-medium">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address formatted properly */}
                  <div className="">
                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Address</span>
                    </div>
                    <div className="text-gray-800 text-sm leading-relaxed">
                      {formatAddress(selectedCustomer.address)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Type */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Type</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`p-6 border-2 rounded-xl text-center transition-all duration-200 hover:shadow-md touch-manipulation min-h-[100px] ${
                  orderType === "pickup"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
              >
                <div className="text-3xl mb-3">🏪</div>
                <div className="font-semibold text-base">Pickup</div>
                <div className="text-xs text-gray-500 mt-1">
                  Customer pickup
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`p-6 border-2 rounded-xl text-center transition-all duration-200 hover:shadow-md touch-manipulation min-h-[100px] ${
                  orderType === "delivery"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
              >
                <div className="text-3xl mb-3">🚚</div>
                <div className="font-semibold text-base">Delivery</div>
                <div className="text-xs text-gray-500 mt-1">Home delivery</div>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("dine-in")}
                className={`p-6 border-2 rounded-xl text-center transition-all duration-200 hover:shadow-md touch-manipulation min-h-[100px] ${
                  orderType === "dine-in"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
              >
                <div className="text-3xl mb-3">🍽️</div>
                <div className="font-semibold text-base">Dine In</div>
                <div className="text-xs text-gray-500 mt-1">In restaurant</div>
              </button>
            </div>
          </div>

          {/* Delivery Address Info (only for delivery) */}
          {orderType === "delivery" && selectedCustomer && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-blue-800 mb-3">
                    Delivery Address
                  </div>
                  <div className="text-blue-700 text-sm leading-relaxed">
                    {formatAddress(selectedCustomer.address)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status Info (only for delivery) */}
          {orderType === "delivery" && (
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-yellow-800 mb-3">
                    Payment Status
                  </div>
                  <div className="text-yellow-700 text-sm leading-relaxed">
                    Payment will be collected upon delivery (Cash on Delivery)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none text-lg touch-manipulation resize-none"
              rows={3}
              placeholder="Any special instructions or notes..."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
            </div>
            <div className="space-y-4">
              {/* Non-Menu Items */}
              {orderItems
                .filter((item) => !item.menuId)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {item.quantity}x {item.productName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Variant: {item.variantName}
                      </div>
                      {item.complements.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-1">
                          <span className="font-medium">Add-ons:</span>
                          {item.complements.map((c, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 px-2 py-1 rounded-full"
                            >
                              {c.itemName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-gray-900 text-lg">
                        €{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Menu Groups */}
              {Object.values(
                orderItems
                  .filter((item) => item.menuId)
                  .reduce(
                    (
                      acc: Record<
                        string,
                        {
                          key: string;
                          menuId: string;
                          menuName: string;
                          secondaryId: number;
                          basePrice: number;
                          taxPerUnit: number;
                          supplementTotal: number;
                          items: OrderItem[];
                        }
                      >,
                      item
                    ) => {
                      const key = `${item.menuId}-${item.menuSecondaryId}`;
                      const menuPrice = item.menuPrice ?? 0;
                      const menuTax = item.menuTax ?? 0;
                      const supplement = item.supplement ?? 0;

                      if (!acc[key]) {
                        acc[key] = {
                          key,
                          menuId: item.menuId!,
                          menuName: item.menuName!,
                          secondaryId: item.menuSecondaryId! as number,
                          basePrice: menuPrice,
                          taxPerUnit: menuTax,
                          supplementTotal: supplement,
                          items: [],
                        };
                      } else {
                        acc[key].supplementTotal += supplement;
                      }
                      acc[key].items.push(item);
                      return acc;
                    },
                    {}
                  )
              ).map((group) => {
                const sectionQuantity = group.items[0]?.quantity || 1;
                const sectionSubtotal = group.basePrice * sectionQuantity;
                const sectionTaxTotal = group.taxPerUnit * sectionQuantity;
                const sectionSupplementTotal =
                  group.supplementTotal * sectionQuantity;
                const sectionTotal =
                  sectionSubtotal + sectionTaxTotal + sectionSupplementTotal;

                return (
                  <div
                    key={group.key}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="p-4 bg-gray-50 rounded-t-xl">
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-gray-900 text-lg">
                          {sectionQuantity}x {group.menuName}
                          {/* {group.secondaryId} */}
                        </div>
                        {/* <div className="text-sm text-gray-600 space-y-2">
                            <div className="flex justify-between">
                              <span>Menu Price</span>
                              <span className="text-right">
                                €{group.basePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Menu Tax ({calculateTaxPercentage(group.basePrice, group.taxPerUnit)}%)</span>
                              <span className="text-right">
                                €{group.taxPerUnit.toFixed(2)}
                              </span>
                            </div>
                            {group.supplementTotal > 0 && (
                              <div className="flex justify-between">
                                <span>Supplements</span>
                                <span className="text-right">
                                  €{group.supplementTotal.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div> */}
                        <div className="font-bold text-gray-900 text-xl">
                          €{sectionTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="border-t border-gray-200 pt-3"
                        >
                          <div className="flex justify-start items-start">
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-medium text-gray-800">
                                  {item.productName}
                                </h3>
                                {/* <div className="text-xs text-indigo-600 mb-1">
                                  Page: {item.menuPageName}
                                  {item.supplement &&
                                    Number(item.supplement) > 0 && (
                                      <span className="ml-1">
                                        {" "}
                                        (+€{item.supplement.toFixed(2)}){" "}
                                      </span>
                                    )}
                                </div> */}
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Variant: {item.variantName}</span>
                                </div>
                              </div>
                              {item.complements.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 font-medium">
                                    Add-ons:
                                  </p>
                                  <div className="text-xs text-gray-600 flex flex-wrap gap-1 mt-1">
                                    {item.complements.map(
                                      (complement, index) => (
                                        <span
                                          key={index}
                                          className="bg-gray-100 px-2 py-1 rounded-full"
                                        >
                                          {complement.itemName}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="border-t-2 border-indigo-200 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-3xl font-bold text-indigo-600 px-6 py-3">
                    €{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 touch-manipulation min-h-[56px] text-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessOrder}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation min-h-[56px] text-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Process Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          setIsOpen={setIsCustomerModalOpen}
          onCustomerCreated={handleNewCustomerCreated}
        />
      )}

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handlePaymentConfirm}
        totalAmount={calculateTotal()}
        existingPaymentType={order?.paymentType}
      />
    </div>
  );
};

export default OrderProcessingModal;
