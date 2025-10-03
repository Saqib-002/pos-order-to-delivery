import React, { useState, useEffect } from "react";
import CustomerModal from "./modals/CustomerModal";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productTax: number;
  variantId: string;
  variantName: string;
  variantPrice: number;
  complements: Array<{
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    price: number;
  }>;
  quantity: number;
  totalPrice: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  cif?: string;
  email?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  onProcessOrder: (orderData: any) => void;
  token: string | null;
}

const OrderProcessingModal: React.FC<OrderProcessingModalProps> = ({
  isOpen,
  onClose,
  orderItems,
  onProcessOrder,
  token,
}) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [paymentType, setPaymentType] = useState<"cash" | "card">("cash");
  const [notes, setNotes] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomerSearch("");
      setOrderType("pickup");
      setPaymentType("cash");
      setNotes("");
      setSearchResults([]);
      setSelectedCustomer(null);
      setIsSearching(false);
      setShowSearchResults(false);
      setIsCustomerModalOpen(false);
    }
  }, [isOpen]);

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
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
      alert("Please select a customer");
      return;
    }

    if (orderType === "delivery" && !selectedCustomer.address.trim()) {
      alert(
        "Selected customer has no address. Please select a different customer or change to pickup."
      );
      return;
    }

    const orderData = {
      customer: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        cif: selectedCustomer.cif || "",
        email: selectedCustomer.email || "",
        comments: selectedCustomer.comments || "",
        address:
          orderType === "delivery" ? selectedCustomer.address : "In-store",
      },
      orderType,
      paymentType: orderType === "pickup" ? paymentType : "cash",
      items: orderItems.map((item) => ({
        id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        price: item.totalPrice / item.quantity,
        category: "Food",
        specialInstructions: `Variant: ${item.variantName}${item.complements.length > 0 ? `, Add-ons: ${item.complements.map((c) => c.itemName).join(", ")}` : ""}`,
      })),
      status: "sent to kitchen",
      notes: notes || `Order total: €${calculateTotal().toFixed(2)}`,
    };
    console.log("Processing order:", orderData);
    onProcessOrder(orderData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-indigo-500">
            Process Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Search */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Customer Search
            </h3>

            {/* Search Input */}
            <div className="relative customer-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type customer name or phone to search..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    ) : (
                      <div className="text-gray-400">🔍</div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <span>+</span>
                  <span>Add New</span>
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectCustomer(customer);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-100"
                    >
                      <div className="text-sm font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-600">
                        {customer.phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Card */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Selected Customer
                  </h4>
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Change
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Name, Phone, Email in one row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="text-gray-800">
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-800">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">
                          Email:
                        </span>
                        <span className="text-gray-800">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address formatted properly */}
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Address
                    </div>
                    <div className="text-gray-800 text-sm">
                      {formatAddress(selectedCustomer.address)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Order Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  orderType === "pickup"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">🏪</div>
                <div className="font-medium text-sm">Pickup</div>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  orderType === "delivery"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">🚚</div>
                <div className="font-medium text-sm">Delivery</div>
              </button>
            </div>
          </div>

          {/* Delivery Address Info (only for delivery) */}
          {orderType === "delivery" && selectedCustomer && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 text-lg">📍</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800 mb-2">
                    Delivery Address
                  </div>
                  <div className="text-blue-700 text-sm leading-relaxed">
                    {formatAddress(selectedCustomer.address)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Type (only for pickup) */}
          {orderType === "pickup" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Payment Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType("cash")}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    paymentType === "cash"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">💵</div>
                  <div className="font-medium text-sm">Cash</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("card")}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    paymentType === "card"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">💳</div>
                  <div className="font-medium text-sm">Card</div>
                </button>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Any special instructions or notes..."
            />
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Order Summary
            </h3>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {item.quantity}x {item.productName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Variant: {item.variantName}
                    </div>
                    {item.complements.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Add-ons:{" "}
                        {item.complements.map((c) => c.itemName).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      €{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    €{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessOrder}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
            >
              Process Order
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          setIsOpen={setIsCustomerModalOpen}
          token={token}
          onCustomerCreated={handleNewCustomerCreated}
        />
      )}
    </div>
  );
};

export default OrderProcessingModal;
