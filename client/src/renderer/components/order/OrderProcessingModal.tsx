import React, { useState, useEffect } from "react";
import CustomerModal from "./modals/CustomerModal";
import PaymentProcessingModal from "./modals/PaymentProcessingModal";
import { toast } from "react-toastify";
import { Order, OrderItem, Customer } from "@/types/order";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { formatAddress } from "@/renderer/utils/utils";
import {
  AddIcon,
  CashIcon,
  CheckIcon,
  CrossIcon,
  DocumentIcon,
  LocationFilledIcon,
  LocationIcon,
  SearchIcon,
} from "@/renderer/assets/Svg";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";

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
    setCustomerSearch(order?.customer?.name || "");
    setOrderType(order?.orderType || "pickup");
    setNotes(order?.notes || "");
    setSearchResults([]);
    setSelectedCustomer(order?.customer?.name ? order.customer : null);
    setIsSearching(false);
    setShowSearchResults(false);
    setIsCustomerModalOpen(false);
  }, []);

  const { orderTotal, nonMenuItems, groups } = calculateOrderTotal(orderItems);

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
    if (orderType === "delivery" && !selectedCustomer) {
      toast.error("Please select a customer for delivery orders");
      return;
    }

    if (
      orderType === "delivery" &&
      selectedCustomer &&
      !selectedCustomer.address.trim()
    ) {
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
        totalAmount: orderTotal,
      });
    }
  };

  const handlePaymentConfirm = (paymentData: {
    paymentType: string;
    totalAmount: number;
  }) => {
    if (orderType === "delivery" && !selectedCustomer) return;

    const orderData = {
      customerName:
        selectedCustomer?.name ||
        (orderType === "dine-in" ? "Dine-in Customer" : "Walk-in Customer"),
      customerPhone: selectedCustomer?.phone || "",
      customerCIF: selectedCustomer?.cif || "",
      customerEmail: selectedCustomer?.email || "",
      customerComments: selectedCustomer?.comments || "",
      customerAddress:
        orderType === "delivery"
          ? selectedCustomer?.address || ""
          : orderType === "dine-in"
            ? "Dine-in"
            : "In-store",
      orderType,
      paymentType:
        orderType === "delivery" ? "pending" : paymentData.paymentType,
      status: "sent to kitchen",
      notes: notes || `Order total: €${orderTotal.toFixed(2)}`,
    };
    onProcessOrder(orderData);
    setIsPaymentModalOpen(false);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <div className="bg-white size-5 p-1 rounded-full">
                <CheckIcon className="size-3 text-indigo-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Process Order</h2>
              <p className="text-indigo-100 text-sm">Complete order details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 touch-manipulation cursor-pointer"
          >
            <CrossIcon className="size-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 touch-pan-y">
          {/* Customer Search */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="bg-blue-500 size-5 p-1 rounded-full">
                  <CheckIcon className="size-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Customer Search {orderType === "delivery" ? "*" : "(Optional)"}
              </h3>
            </div>

            {/* Search Input */}
            <div className="flex gap-6 relative">
              <CustomInput
                label={`Search Customer ${orderType === "delivery" ? "*" : "(Optional)"}`}
                placeholder="Type customer name or phone to search..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                required={orderType === "delivery"}
                name="search-customer"
                type="text"
                inputClasses="py-3 px-4 text-lg pr-12"
                postLabel={
                  isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 touch-manipulation"></div>
                  ) : (
                    <SearchIcon className="size-5 text-gray-400" />
                  )
                }
                secLabelClasses="absolute right-4 top-4 w-max"
                otherClasses="flex-1"
              />
              <CustomButton
                label="Add New"
                type="button"
                variant="green"
                onClick={() => setIsCustomerModalOpen(true)}
                Icon={<AddIcon className="size-5" />}
                className="h-max py-3 self-end text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 touch-manipulation"
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 top-20 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2 customer-search-container">
                  {searchResults.map((customer) => (
                    <CustomButton
                      key={customer.id}
                      type="button"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectCustomer(customer);
                      }}
                      variant="transparent"
                      label={
                        <>
                          <div className="text-base font-semibold text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {customer.phone}
                          </div>
                        </>
                      }
                      className="hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 w-full touch-manipulation !block text-start rounded-none"
                    />
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
                  <CustomButton
                    type="button"
                    onClick={clearCustomerSelection}
                    label="Change"
                    variant="transparent"
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 touch-manipulation !py-1 !px-3"
                  />
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
                      <LocationFilledIcon className="text-indigo-600 size-4" />
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
                <div className="w-3 h-2 bg-orange-600"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Type</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomButton
                type="button"
                onClick={() => setOrderType("pickup")}
                variant="transparent"
                className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${
                  orderType === "pickup"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
                label={
                  <>
                    <div className="text-3xl mb-3">🏪</div>
                    <div className="font-semibold text-base">Pickup</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Customer pickup
                    </div>
                  </>
                }
              />
              <CustomButton
                type="button"
                onClick={() => setOrderType("delivery")}
                variant="transparent"
                className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${
                  orderType === "delivery"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
                label={
                  <>
                    <div className="text-3xl mb-3">🚚</div>
                    <div className="font-semibold text-base">Delivery</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Home delivery
                    </div>
                  </>
                }
              />
              <CustomButton
                type="button"
                onClick={() => setOrderType("dine-in")}
                variant="transparent"
                className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${
                  orderType === "dine-in"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white"
                }`}
                label={
                  <>
                    <div className="text-3xl mb-3">🍽️</div>
                    <div className="font-semibold text-base">Dine In</div>
                    <div className="text-xs text-gray-500 mt-1">
                      In restaurant
                    </div>
                  </>
                }
              />
            </div>
          </div>

          {/* Delivery Address Info (only for delivery) */}
          {orderType === "delivery" && selectedCustomer && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <LocationFilledIcon className="size-5 text-blue-600" />
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
          )}

          {/* Payment Status Info (only for delivery) */}
          {orderType === "delivery" && (
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CashIcon className="size-5 text-yellow-600" />
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
          )}

          {/* Order Notes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="text-purple-600 size-5" />
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
                <div className="w-3 h-2 bg-indigo-600"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
            </div>
            <div className="space-y-4">
              {/* Non-Menu Items */}
              {nonMenuItems.map((item) => (
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
              {groups.map((group) => {
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
                    €{orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex space-x-4">
          <CustomButton
            type="button"
            onClick={onClose}
            variant="secondary"
            label="Cancel"
            className="flex-1 text-lg"
          />
          <CustomButton
            type="button"
            onClick={handleProcessOrder}
            className="flex-1 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700"
            Icon={
              <span className="bg-white rounded-full size-5 flex justify-center items-center">
                <CheckIcon className="size-3 text-indigo-600" />
              </span>
            }
            label="Proceed Order"
          />
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
        totalAmount={orderTotal}
        existingPaymentType={order?.paymentType}
      />
    </div>
  );
};

export default OrderProcessingModal;
