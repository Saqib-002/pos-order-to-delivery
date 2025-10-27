import React, { useState, useEffect } from "react";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import CustomerModal from "./modals/CustomerModal";
import PaymentProcessingModal from "./modals/PaymentProcessingModal";
import PaymentOptionModal from "./modals/PaymentOptionModal";
import { toast } from "react-toastify";
import { Order, OrderItem, Customer } from "@/types/order";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { formatAddress } from "@/renderer/utils/utils";
import { calculatePaymentStatus } from "@/renderer/utils/paymentStatus";
import { useTranslation } from "react-i18next";
import {
  AddIcon,
  CashIcon,
  CheckIcon,
  CrossIcon,
  DocumentIcon,
  LocationFilledIcon,
  LocationIcon,
  SearchIcon,
} from "@/renderer/public/Svg";
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
  const { t } = useTranslation();
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery" | "dine-in">(
    "pickup"
  );
  const [pickupTime, setPickupTime] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customCustomerPhone, setCustomCustomerPhone] = useState("");
  const [customCustomerAddress, setCustomCustomerAddress] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentOptionModalOpen, setIsPaymentOptionModalOpen] =
    useState(false);
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
    setIsSearching(false);
    setShowSearchResults(false);
    setIsCustomerModalOpen(false);

    if (order?.customer?.name) {
      setSelectedCustomer(order.customer);
      setCustomCustomerName("");
      setCustomCustomerPhone("");
      setCustomCustomerAddress("");
    } else {
      setSelectedCustomer(null);
      setCustomCustomerName("");
      setCustomCustomerPhone("");
      setCustomCustomerAddress("");
    }
  }, [order]);

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
    setCustomCustomerName("");
    setCustomCustomerPhone("");
    setShowSearchResults(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomCustomerName("");
    setCustomCustomerPhone("");
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
      if (!customCustomerName.trim() || !customCustomerPhone.trim()) {
        toast.error(t("orderProcessingModal.errors.customerNamePhoneRequired"));
        return;
      }
    }

    if (
      orderType === "delivery" &&
      selectedCustomer &&
      !selectedCustomer.address.trim()
    ) {
      toast.error(t("orderProcessingModal.errors.customerNoAddress"));
      return;
    }

    const currentPaymentStatus = calculatePaymentStatus(
      order?.paymentType || "",
      orderTotal
    );

    if (currentPaymentStatus.status === "PAID") {
      toast.info(t("orderProcessingModal.errors.orderAlreadyPaid"));
      handlePaymentConfirm({
        paymentType: order?.paymentType || "paid",
        totalAmount: orderTotal,
      });
      return;
    }

    if (orderType === "dine-in" || orderType === "pickup") {
      setIsPaymentOptionModalOpen(true);
    } else {
      handlePaymentConfirm({
        paymentType: "pending",
        totalAmount: orderTotal,
      });
    }
  };

  const handlePayNow = () => {
    setIsPaymentOptionModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePayLater = () => {
    setIsPaymentOptionModalOpen(false);
    handlePaymentConfirm({
      paymentType: "pending",
      totalAmount: orderTotal,
    });
  };

  const handlePaymentConfirm = (paymentData: {
    paymentType: string;
    totalAmount: number;
  }) => {
    if (
      orderType === "delivery" &&
      !selectedCustomer &&
      (!customCustomerName.trim() ||
        !customCustomerPhone.trim() ||
        !customCustomerAddress.trim())
    ) {
      toast.error(t("orderProcessingModal.errors.customerDetailsRequired"));
      return;
    }

    const customerName =
      selectedCustomer?.name ||
      customCustomerName.trim() ||
      (orderType === "dine-in"
        ? t("orderProcessingModal.defaultCustomers.dineInCustomer")
        : t("orderProcessingModal.defaultCustomers.walkInCustomer"));
    const customerPhone = selectedCustomer?.phone || customCustomerPhone.trim();
    const customerAddress =
      selectedCustomer?.address || customCustomerAddress.trim();

    const orderData = {
      customerName,
      customerPhone,
      customerCIF: selectedCustomer?.cif || "",
      customerEmail: selectedCustomer?.email || "",
      customerComments: selectedCustomer?.comments || "",
      customerAddress:
        orderType === "delivery"
          ? customerAddress
          : orderType === "dine-in"
            ? t("orderProcessingModal.defaultCustomers.dineIn")
            : t("orderProcessingModal.defaultCustomers.inStore"),
      orderType,
      paymentType:
        orderType === "delivery" ? "pending" : paymentData.paymentType,
      status:
        order?.status === "pending"
          ? "sent to kitchen"
          : order?.status || "sent to kitchen",
      notes: notes || "",
      pickupTime:
        orderType === "pickup" && pickupTime ? pickupTime.format("HH:mm") : "",
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
              <h2 className="text-2xl font-bold">
                {t("orderProcessingModal.title")}
              </h2>
              <p className="text-indigo-100 text-sm">
                {t("orderProcessingModal.subtitle")}
              </p>
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
              <h3 className="text-xl font-bold text-black">
                {orderType === "delivery"
                  ? t("orderProcessingModal.customerSearch.titleRequired")
                  : t("orderProcessingModal.customerSearch.titleOptional")}
              </h3>
            </div>

            {/* Search Input */}
            <div className="flex gap-6 relative">
              <CustomInput
                label={
                  orderType === "delivery"
                    ? t("orderProcessingModal.customerSearch.titleRequired")
                    : t("orderProcessingModal.customerSearch.titleOptional")
                }
                placeholder={t(
                  "orderProcessingModal.customerSearch.placeholder"
                )}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (e.target.value.trim() && !selectedCustomer) {
                    setCustomCustomerName("");
                    setCustomCustomerPhone("");
                  }
                }}
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
                label={t("orderProcessingModal.customerSearch.addNew")}
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
                          <div className="text-base font-semibold text-black">
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
                  <h4 className="text-lg font-bold text-black flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span>
                      {t(
                        "orderProcessingModal.customerSearch.selectedCustomer"
                      )}
                    </span>
                  </h4>
                  <CustomButton
                    type="button"
                    onClick={clearCustomerSelection}
                    label={t("orderProcessingModal.customerSearch.change")}
                    variant="transparent"
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 touch-manipulation !py-1 !px-3"
                  />
                </div>
                <div className="space-y-4">
                  {/* Name, Phone, Email in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600">
                        {t("orderProcessingModal.customerSearch.name")}
                      </span>
                      <span className="text-black font-medium">
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600">
                        {t("orderProcessingModal.customerSearch.phone")}
                      </span>
                      <span className="text-black font-medium">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">
                          {t("orderProcessingModal.customerSearch.email")}
                        </span>
                        <span className="text-black font-medium">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address formatted properly - only show if customer has address */}
                  {selectedCustomer.address &&
                    selectedCustomer.address.trim() && (
                      <div className="">
                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                          <LocationFilledIcon className="text-indigo-600 size-4" />
                          <span>
                            {t("orderProcessingModal.customerSearch.address")}
                          </span>
                        </div>
                        <div className="text-gray-800 text-sm leading-relaxed">
                          {selectedCustomer.address &&
                          selectedCustomer.address.includes("|")
                            ? formatAddress(selectedCustomer.address)
                            : selectedCustomer.address}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Custom Customer Fields - Show when no customer is selected */}
            {!selectedCustomer && (
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="bg-blue-500 size-4 p-0.5 rounded-full">
                      <CheckIcon className="size-3 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-black">
                    {orderType === "delivery"
                      ? t("orderProcessingModal.customerDetails.titleRequired")
                      : t("orderProcessingModal.customerDetails.titleOptional")}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    label={t(
                      "orderProcessingModal.customerDetails.customerName"
                    )}
                    placeholder={t(
                      "orderProcessingModal.customerDetails.enterCustomerName"
                    )}
                    value={customCustomerName}
                    onChange={(e) => {
                      setCustomCustomerName(e.target.value);
                      // Clear customer search when user starts typing custom name
                      if (e.target.value.trim() && !selectedCustomer) {
                        setCustomerSearch("");
                      }
                    }}
                    required={orderType === "delivery"}
                    name="custom-customer-name"
                    type="text"
                    inputClasses="py-3 px-4 text-lg"
                    otherClasses="w-full"
                  />
                  <CustomInput
                    label={t(
                      "orderProcessingModal.customerDetails.phoneNumber"
                    )}
                    placeholder={t(
                      "orderProcessingModal.customerDetails.enterPhoneNumber"
                    )}
                    value={customCustomerPhone}
                    onChange={(e) => {
                      setCustomCustomerPhone(e.target.value);
                      if (e.target.value.trim() && !selectedCustomer) {
                        setCustomerSearch("");
                      }
                    }}
                    required={orderType === "delivery"}
                    name="custom-customer-phone"
                    type="tel"
                    inputClasses="py-3 px-4 text-lg"
                    otherClasses="w-full"
                  />
                </div>

                {/* Address field - only show for delivery orders */}
                {orderType === "delivery" && (
                  <div className="mt-4">
                    <CustomInput
                      label={t(
                        "orderProcessingModal.customerDetails.deliveryAddress"
                      )}
                      placeholder={t(
                        "orderProcessingModal.customerDetails.enterDeliveryAddress"
                      )}
                      value={customCustomerAddress}
                      onChange={(e) => {
                        setCustomCustomerAddress(e.target.value);
                        if (e.target.value.trim() && !selectedCustomer) {
                          setCustomerSearch("");
                        }
                      }}
                      required={orderType === "delivery"}
                      name="custom-customer-address"
                      type="text"
                      inputClasses="py-3 px-4 text-lg"
                      otherClasses="w-full"
                    />
                  </div>
                )}

                <div className="mt-3 text-sm text-gray-600">
                  {orderType === "delivery"
                    ? t(
                        "orderProcessingModal.customerDetails.descriptionRequired"
                      )
                    : t(
                        "orderProcessingModal.customerDetails.descriptionOptional"
                      )}
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
              <h3 className="text-xl font-bold text-black">
                {t("orderProcessingModal.orderType.title")}
              </h3>
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
                    <div className="font-semibold text-base">
                      {t("orderProcessingModal.orderType.pickup.title")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t("orderProcessingModal.orderType.pickup.description")}
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
                    <div className="font-semibold text-base">
                      {t("orderProcessingModal.orderType.delivery.title")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t("orderProcessingModal.orderType.delivery.description")}
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
                    <div className="font-semibold text-base">
                      {t("orderProcessingModal.orderType.dineIn.title")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t("orderProcessingModal.orderType.dineIn.description")}
                    </div>
                  </>
                }
              />
            </div>
          </div>

          {/* Pickup Time (only for pickup) */}
          {orderType === "pickup" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-2 bg-green-600"></div>
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t("orderProcessingModal.pickupTime.title")}
                </h3>
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileTimePicker
                  value={pickupTime}
                  onChange={(newValue: Dayjs | null) => setPickupTime(newValue)}
                  label={t("orderProcessingModal.pickupTime.placeholder")}
                  views={["hours", "minutes"]}
                  ampm={false}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.75rem",
                      padding: "0.75rem 1rem",
                      fontSize: "1.125rem",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#6366f1",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#6366f1",
                        borderWidth: "2px",
                      },
                    },
                  }}
                />
              </LocalizationProvider>
              <p className="text-sm text-gray-500">
                {t("orderProcessingModal.pickupTime.description")}
              </p>
            </div>
          )}

          {/* Delivery Address Info (only for delivery) */}
          {orderType === "delivery" &&
            selectedCustomer &&
            selectedCustomer.address && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <LocationFilledIcon className="size-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-blue-800 mb-3">
                    {t("orderProcessingModal.deliveryAddress.title")}
                  </div>
                  <div className="text-blue-700 text-sm leading-relaxed">
                    {selectedCustomer.address &&
                    selectedCustomer.address.includes("|")
                      ? formatAddress(selectedCustomer.address)
                      : selectedCustomer.address}
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
                  {t("orderProcessingModal.paymentStatus.title")}
                </div>
                <div className="text-yellow-700 text-sm leading-relaxed">
                  {t("orderProcessingModal.paymentStatus.description")}
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
              <h3 className="text-xl font-bold text-black">
                {t("orderProcessingModal.orderNotes.title")}
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none text-lg touch-manipulation resize-none"
              rows={3}
              placeholder={t("orderProcessingModal.orderNotes.placeholder")}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-2 bg-indigo-600"></div>
              </div>
              <h3 className="text-xl font-bold text-black">
                {t("orderProcessingModal.orderSummary.title")}
              </h3>
            </div>
            <div className="space-y-4">
              {/* Non-Menu Items */}
              {nonMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-black text-lg">
                      {item.quantity}x {item.productName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t("orderProcessingModal.orderSummary.variant")}{" "}
                      {item.variantName}
                    </div>
                    {item.complements.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-1">
                        <span className="font-medium">
                          {t("orderProcessingModal.orderSummary.addOns")}
                        </span>
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
                    <div className="font-bold text-black text-lg">
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
                        <div className="font-semibold text-black text-lg">
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
                        <div className="font-bold text-black text-xl">
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
                                  <span>
                                    {t(
                                      "orderProcessingModal.orderSummary.variant"
                                    )}{" "}
                                    {item.variantName}
                                  </span>
                                </div>
                              </div>
                              {item.complements.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 font-medium">
                                    {t(
                                      "orderProcessingModal.orderSummary.addOns"
                                    )}
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
                  <span className="text-2xl font-bold text-black">
                    {t("orderProcessingModal.orderSummary.total")}
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
            label={t("orderProcessingModal.buttons.cancel")}
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
            label={t("orderProcessingModal.buttons.proceedOrder")}
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

      {/* Payment Option Modal */}
      <PaymentOptionModal
        isOpen={isPaymentOptionModalOpen}
        onClose={() => setIsPaymentOptionModalOpen(false)}
        onPayNow={handlePayNow}
        onPayLater={handlePayLater}
        totalAmount={orderTotal}
        orderType={orderType as "pickup" | "dine-in"}
      />

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
