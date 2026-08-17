import React, { useState, useEffect, useRef } from "react";
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
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { formatAddress } from "@/renderer/utils/utils";
import { calculatePaymentStatus } from "@/renderer/utils/paymentStatus";
import DeliveryRouteModal from "./modals/DeliveryRouteModal";
import { calculateDistance, geocodeAddress, isPointInPolygon } from "@/renderer/utils/googleMaps";
import { useTranslation } from "react-i18next";
import {
  AddIcon,
  AnalyticsIcon,
  CarIcon,
  CashIcon,
  CheckIcon,
  CrossIcon,
  DeliveredIcon,
  DocumentIcon,
  LocationFilledIcon,
  LocationIcon,
  PersonIcon,
  SearchIcon,
} from "@/renderer/public/Svg";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import { AddressAutocomplete } from "../shared/AddressAutocomplete";

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
  const { auth } = useAuth();
  const { configurations } = useConfigurations();
  const [sentToKitchenCount, setSentToKitchenCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderType, setOrderType] = useState<
    | "delivery"
    | "pickup"
    | "dine-in"
    | "web:delivery"
    | "web:pickup"
    | "app:delivery"
    | "app:pickup"
  >("delivery");
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, typeRes] = await Promise.all([
          (window as any).electronAPI.getOrdersCountByStatus(
            auth?.token,
            "sent to kitchen"
          ),
          (window as any).electronAPI.getOrdersCountByType(
            auth?.token,
            "sent to kitchen"
          ),
        ]);

        if (statusRes.status) {
          setSentToKitchenCount(statusRes.data);
        }
        if (typeRes.status) {
          setTypeCounts(typeRes.data);
        }
      } catch (error) {
        console.error("Error fetching kitchen counts:", error);
      }
    };

    if (auth?.token) {
      fetchData();
    }
  }, [auth?.token]);

  const calculateEstimatedTime = (orderCount: number): number => {
    const ranges = configurations?.kitchenTimeEstimationRanges;
    if (!ranges || ranges.length === 0) {
      return 0;
    }

    const applicableRange = ranges.find(
      (range) => orderCount >= range.minOrders && orderCount <= range.maxOrders
    );

    if (applicableRange) {
      return applicableRange.estimatedTime;
    }

    const sortedRanges = ranges.sort((a, b) => b.maxOrders - a.maxOrders);
    const highestRange = sortedRanges.find(
      (range) => orderCount >= range.minOrders
    );

    return highestRange?.estimatedTime || 0;
  };

  const estimatedTime = calculateEstimatedTime(sentToKitchenCount);

  const [pickupTime, setPickupTime] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customCustomerPhone, setCustomCustomerPhone] = useState("");
  const [customCustomerAddress, setCustomCustomerAddress] = useState("");
  const [customAddressFields, setCustomAddressFields] = useState({
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    province: "",
  });
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
  const [customerDistance, setCustomerDistance] = useState<number | null>(null);

  useEffect(() => {
    setCustomerSearch(order?.customer?.name || "");
    setNotes(order?.notes || "");
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchResults(false);
    setIsCustomerModalOpen(false);
    if (
      order?.orderType === "delivery" ||
      order?.orderType === "pickup" ||
      order?.orderType === "dine-in" ||
      order?.orderType === "web:delivery" ||
      order?.orderType === "web:pickup" ||
      order?.orderType === "app:delivery" ||
      order?.orderType === "app:pickup"
    ) {
      setOrderType(order.orderType as any);
    } else {
      setOrderType("delivery");
    }

    if (order?.pickupTime) {
      setPickupTime(dayjs(order.pickupTime, "HH:mm"));
    } else {
      setPickupTime(null);
    }

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
    if (!searchTerm.trim() || !auth?.token) return;
    setIsSearching(true);
    try {
      const result = await (window as any).electronAPI.getCustomersByPhone(
        auth.token,
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
  }, [customerSearch, auth?.token]);

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

  useEffect(() => {
    const updateDistance = async () => {
      const customerAddress = selectedCustomer
        ? selectedCustomer.address
        : customCustomerAddress;

      const restaurantAddress = configurations?.address;
      const apiKey = configurations?.googleMapsApiKey;

      if (!customerAddress || !customerAddress.trim() || !restaurantAddress || !apiKey) {
        setCustomerDistance(null);
        return;
      }

      const distance = await calculateDistance(
        restaurantAddress,
        formatAddress(customerAddress),
        apiKey
      );
      setCustomerDistance(distance);
    };

    updateDistance();
  }, [selectedCustomer, customCustomerAddress, configurations?.address, configurations?.googleMapsApiKey]);

  const handlePaymentConfirm = (paymentData: {
    paymentType: string;
    totalAmount: number;
  }) => {
    if (
      (orderType === "delivery" || orderType === "web:delivery" || orderType === "app:delivery") &&
      !selectedCustomer &&
      (!customCustomerPhone.trim() || !customCustomerAddress.trim())
    ) {
      toast.error(t("orderProcessingModal.errors.customerDetailsRequired"));
      return;
    }
    const customerName =
      selectedCustomer?.name ||
      customCustomerName.trim() ||
      (orderType === "dine-in"
        ? t("orderProcessingModal.defaultCustomers.dineInCustomer")
        : (orderType === "delivery" || orderType === "web:delivery" || orderType === "app:delivery")
          ? t("orderProcessingModal.defaultCustomers.deliveryCustomer")
          : t("orderProcessingModal.defaultCustomers.walkInCustomer"));
    const customerPhone = selectedCustomer?.phone || customCustomerPhone.trim();
    const customerAddress =
      (selectedCustomer?.address && selectedCustomer.address.trim()) ||
      customCustomerAddress.trim() ||
      undefined;

    const existingPaymentType = order?.paymentType?.trim();
    const preserveExistingPaymentType =
      existingPaymentType &&
      existingPaymentType.length > 0 &&
      existingPaymentType.toLowerCase() !== "pending";
    const resolvedPaymentType =
      preserveExistingPaymentType &&
        (!paymentData.paymentType ||
          paymentData.paymentType.trim().toLowerCase() === "pending")
        ? existingPaymentType
        : paymentData.paymentType || existingPaymentType || "pending";

    const isTransitioningToNonDelivery =
      (orderType === "pickup" ||
        orderType === "dine-in" ||
        orderType === "web:pickup" ||
        orderType === "app:pickup") &&
      (order?.orderType === "delivery" ||
        order?.orderType === "web:delivery" ||
        order?.orderType === "app:delivery");
    const isTransitioningToDelivery =
      (orderType === "delivery" ||
        orderType === "web:delivery" ||
        orderType === "app:delivery") &&
      (order?.orderType === "pickup" ||
        order?.orderType === "dine-in" ||
        order?.orderType === "web:pickup" ||
        order?.orderType === "app:pickup");

    let finalStatus = order?.status === "pending" ? "sent to kitchen" : (order?.status || "sent to kitchen");
    let deliveryPerson: any = order?.deliveryPerson;
    let assignedAt: any = order?.assignedAt;
    let deliveredAt: any = order?.deliveredAt;

    if (isTransitioningToNonDelivery) {
      if (finalStatus === "ready for delivery" || finalStatus === "out for delivery") {
        finalStatus = "completed";
      }
      deliveryPerson = null;
      assignedAt = null;
      deliveredAt = null;
    } else if (isTransitioningToDelivery) {
      if (finalStatus === "completed") {
        finalStatus = "ready for delivery";
        assignedAt = null;
        deliveredAt = null;
      }
    }

    const orderData = {
      customerName,
      customerPhone,
      customerCIF: selectedCustomer?.cif || "",
      customerEmail: selectedCustomer?.email || "",
      customerComments: selectedCustomer?.comments || "",
      customerAddress:
        (orderType === "delivery" || orderType === "web:delivery" || orderType === "app:delivery")
          ? customerAddress
          : orderType === "dine-in"
            ? t("orderProcessingModal.defaultCustomers.dineIn")
            : t("orderProcessingModal.defaultCustomers.inStore"),
      orderType,
      paymentType: resolvedPaymentType,
      status: finalStatus,
      deliveryPerson: deliveryPerson,
      assignedAt,
      deliveredAt,
      notes: notes || "",
      pickupTime:
        (orderType === "pickup" || orderType === "web:pickup" || orderType === "app:pickup") && pickupTime
          ? pickupTime.format("HH:mm")
          : "",
    };
    onProcessOrder(orderData);
    setIsPaymentModalOpen(false);
    onClose();
  };

  const handlePayNow = () => {
    setIsPaymentOptionModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePayLater = () => {
    setIsPaymentOptionModalOpen(false);
    handlePaymentConfirm({
      paymentType:
        order?.paymentType && order.paymentType.trim() !== ""
          ? order.paymentType
          : "pending",
      totalAmount: orderTotal,
    });
  };

  const proceedToPayment = () => {
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

    if (
      orderType === "dine-in" ||
      orderType === "pickup" ||
      orderType === "web:pickup" ||
      orderType === "app:pickup"
    ) {
      setIsPaymentOptionModalOpen(true);
    } else {
      handlePaymentConfirm({
        paymentType:
          order?.paymentType && order.paymentType.trim() !== ""
            ? order.paymentType
            : "pending",
        totalAmount: orderTotal,
      });
    }
  };

  const handleProcessOrder = () => {
    if (
      orderType === "delivery" ||
      orderType === "web:delivery" ||
      orderType === "app:delivery"
    ) {
      if (!selectedCustomer && !customCustomerPhone.trim()) {
        toast.error(t("orderProcessingModal.errors.customerPhoneRequired"));
        return;
      }

      const checkDeliveryRequirement = async () => {
        const customerAddress = selectedCustomer
          ? selectedCustomer.address
          : customCustomerAddress;

        if (!customerAddress || !customerAddress.trim()) {
          toast.error(t("orderProcessingModal.errors.customerDetailsRequired"));
          return false;
        }

        const restaurantAddress = configurations.address;
        const apiKey = configurations.googleMapsApiKey;

        if (!restaurantAddress || !apiKey) {
          console.warn("Restaurant address or Google Maps API key missing. Skipping distance check.");
          return true;
        }

        const customerLocation = await geocodeAddress(formatAddress(customerAddress), apiKey);
        if (!customerLocation) {
          console.warn("Could not geocode customer address. Proceeding without zone check.");
          return true;
        }

        const zones = configurations.deliveryZones || [];
        if (zones.length === 0) return true;

        const applicableZone = zones.find((zone: any) =>
          isPointInPolygon(customerLocation, zone.points)
        );

        if (applicableZone) {
          if (orderTotal < applicableZone.minOrderAmount) {
            toast.error(
              t("orderProcessingModal.errors.minOrderAmountNotMetZone", {
                zoneName: applicableZone.name,
                minAmount: applicableZone.minOrderAmount.toFixed(2),
                currentAmount: orderTotal.toFixed(2),
              })
            );
            return false;
          }
        } else {
          toast.error(t("orderProcessingModal.errors.outsideDeliveryZones"));
          return false;
        }

        return true;
      };

      checkDeliveryRequirement().then((isValid) => {
        if (isValid) {
          proceedToPayment();
        }
      });
      return;
    }

    proceedToPayment();
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="relative bg-gradient-to-r from-black to-gray-800 text-white p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <div className="bg-white size-5 p-1 rounded-full">
                  <CheckIcon className="size-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("orderProcessingModal.title")}
                </h2>
                <p className="text-white text-sm">
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

          {sentToKitchenCount > 0 && (
            <div className="absolute inset-x-0 top-8 w-fit left-1/2 -translate-x-1/2 flex flex-col items-center">
              <p className="text-white text-xs bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-lg mb-2">
                {sentToKitchenCount > 0 && estimatedTime > 0
                  ? t("orderProcessingModal.sentToKitchenWithTime", {
                    count: sentToKitchenCount,
                    time: estimatedTime,
                  })
                  : t("orderProcessingModal.sentToKitchenCount", {
                    count: sentToKitchenCount,
                  })}
              </p>
              {Object.keys(typeCounts).length > 0 && (
                <div className="flex gap-2">
                  {Object.entries(typeCounts).map(([type, count]) => {
                    const translationKey =
                      type === "dine-in" ? "dineIn" : type;

                    let Icon = DeliveredIcon;
                    let color = "text-orange-400";
                    let bgColor = "bg-orange-500/20";

                    if (type === "pickup") {
                      Icon = CarIcon;
                      color = "text-blue-400";
                      bgColor = "bg-blue-500/20";
                    } else if (type === "dine-in") {
                      Icon = PersonIcon;
                      color = "text-purple-400";
                      bgColor = "bg-purple-500/20";
                    } else if (type === "platform") {
                      Icon = AnalyticsIcon;
                      color = "text-pink-400";
                      bgColor = "bg-pink-500/20";
                    }

                    return (
                      <span
                        key={type}
                        className={`text-[12px] text-white/90 ${bgColor} px-2 py-1 rounded-full border border-white/10 uppercase font-bold flex items-center gap-1.5 backdrop-blur-md shadow-sm`}
                      >
                        <Icon className={`size-3 ${color}`} />
                        <span>
                          {t(`kitchenView.stats.${translationKey}`)}: {count}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
                {(orderType === "delivery" || orderType === "web:delivery" || orderType === "app:delivery")
                  ? t("orderProcessingModal.customerSearch.titleRequired")
                  : t("orderProcessingModal.customerSearch.titleOptional")}
              </h3>
            </div>

            {/* Search Input */}
            <div className="flex gap-6 relative">
              <CustomInput
                label={
                  (orderType === "delivery" || orderType === "web:delivery" || orderType === "app:delivery")
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
                name="search-customer"
                type="text"
                inputClasses="py-3 px-4 text-lg pr-12"
                postLabel={
                  isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black touch-manipulation"></div>
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
                className="h-max py-3 self-end text-lg bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 touch-manipulation"
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
                      className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0 w-full touch-manipulation !block text-start rounded-none"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Card */}
            {selectedCustomer && (
              <div className="mt-6 p-6 bg-gradient-to-br from-gray  -50 to-gray-100 border-2 border-gray-200 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-black flex items-center space-x-2">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 touch-manipulation !py-1 !px-3"
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
                          <LocationFilledIcon className="text-gray-600 size-4" />
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
                        {customerDistance !== null &&
                          (orderType === "delivery" ||
                            orderType === "web:delivery" ||
                            orderType === "app:delivery") && (
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                              <LocationIcon className="size-4" />
                              <span>
                                {t("orderProcessingModal.customerSearch.distance", {
                                  distance: customerDistance.toFixed(2),
                                })}
                              </span>
                            </div>
                            <CustomButton
                              type="button"
                              onClick={() => setIsRouteModalOpen(true)}
                              variant="transparent"
                              className="text-xs text-blue-600 hover:text-blue-700 underline p-0 h-auto"
                              label={t("orderProcessingModal.customerSearch.viewRoute")}
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Order Type */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-5 rounded-full bg-black flex items-center justify-center">
                  <CheckIcon className="size-3 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t("orderProcessingModal.orderType.title")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomButton
                  type="button"
                  onClick={() => {
                    if (order?.orderType?.startsWith("app:")) {
                      setOrderType("app:delivery");
                    } else if (order?.orderType?.startsWith("web:")) {
                      setOrderType("web:delivery");
                    } else {
                      setOrderType("delivery");
                    }
                  }}
                  variant="transparent"
                  className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${
                    orderType === "delivery" ||
                    orderType === "web:delivery" ||
                    orderType === "app:delivery"
                      ? "border-black bg-gray-50 text-gray-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  label={
                    <>
                      <div className="mb-3 flex justify-center">
                        <img
                          src="./images/delivery-bike.png"
                          alt="Delivery"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
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
                  onClick={() => {
                    if (order?.orderType?.startsWith("app:")) {
                      setOrderType("app:pickup");
                    } else if (order?.orderType?.startsWith("web:")) {
                      setOrderType("web:pickup");
                    } else {
                      setOrderType("pickup");
                    }
                  }}
                  variant="transparent"
                  className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${
                    orderType === "pickup" ||
                    orderType === "web:pickup" ||
                    orderType === "app:pickup"
                      ? "border-black bg-gray-50 text-gray-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  label={
                    <>
                      <div className="mb-3 flex justify-center">
                        <img
                          src="./images/pickup.png"
                          alt="Pickup"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
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
                  onClick={() => setOrderType("dine-in")}
                  variant="transparent"
                  className={`!p-6 border-2 rounded-xl text-center !block transition-all duration-200 hover:shadow-md min-h-[100px] ${orderType === "dine-in"
                    ? "border-black bg-gray-50 text-gray-700 shadow-md"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  label={
                    <>
                      <div className="mb-3 flex justify-center">
                        <img
                          src="./images/dinein.png"
                          alt="Dine In"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
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
                    name="custom-customer-phone"
                    type="tel"
                    inputClasses="py-3 px-4 text-lg"
                    otherClasses="w-full"
                  />
                </div>

                {orderType === "delivery" && (
                  <div className="mt-4">
                    <AddressAutocomplete
                      label={t(
                        "orderProcessingModal.customerDetails.deliveryAddress"
                      )}
                      placeholder={t(
                        "orderProcessingModal.customerDetails.enterDeliveryAddress"
                      )}
                      value={customAddressFields.address}
                      onChange={(value) => {
                        setCustomAddressFields((prev) => {
                          const updated = {
                            ...prev,
                            address: value,
                          };
                          // Update address string synchronously with updated values
                          const addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}${updated.apartment ? `|apartment=${updated.apartment}` : ""}`;
                          setCustomCustomerAddress(addressString);
                          return updated;
                        });
                        if (value.trim() && !selectedCustomer) {
                          setCustomerSearch("");
                        }
                      }}
                      onAddressSelect={(components) => {
                        const newFields = {
                          address: components.address,
                          apartment: components.apartment || "",
                          postalCode: components.postalCode,
                          city: components.city,
                          province: components.province,
                        };
                        setCustomAddressFields(newFields);
                        let addressString = `address=${components.address}|postal=${components.postalCode}|city=${components.city}|province=${components.province}`;
                        if (components.apartment) {
                          addressString += `|apartment=${components.apartment}`;
                        }
                        setCustomCustomerAddress(addressString);
                      }}
                      apartmentValue={customAddressFields.apartment}
                      postalCodeValue={customAddressFields.postalCode}
                      cityValue={customAddressFields.city}
                      provinceValue={customAddressFields.province}
                      onApartmentChange={(value) => {
                        setCustomAddressFields((prev) => {
                          const updated = {
                            ...prev,
                            apartment: value,
                          };
                          const addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}${updated.apartment ? `|apartment=${updated.apartment}` : ""}`;
                          setCustomCustomerAddress(addressString);
                          return updated;
                        });
                      }}
                      onPostalCodeChange={(value) => {
                        setCustomAddressFields((prev) => {
                          const updated = {
                            ...prev,
                            postalCode: value,
                          };
                          const addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}${updated.apartment ? `|apartment=${updated.apartment}` : ""}`;
                          setCustomCustomerAddress(addressString);
                          return updated;
                        });
                      }}
                      onCityChange={(value) => {
                        setCustomAddressFields((prev) => {
                          const updated = {
                            ...prev,
                            city: value,
                          };
                          const addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}${updated.apartment ? `|apartment=${updated.apartment}` : ""}`;
                          setCustomCustomerAddress(addressString);
                          return updated;
                        });
                      }}
                      onProvinceChange={(value) => {
                        setCustomAddressFields((prev) => {
                          const updated = {
                            ...prev,
                            province: value,
                          };
                          const addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}${updated.apartment ? `|apartment=${updated.apartment}` : ""}`;
                          setCustomCustomerAddress(addressString);
                          return updated;
                        });
                      }}
                      searchAddressLabel={t(
                        "customerManagement.modal.searchAddress"
                      )}
                      apartmentLabel={t("customerManagement.modal.apartment")}
                      postalCodeLabel={t("customerManagement.modal.postalCode")}
                      cityLabel={t("customerManagement.modal.city")}
                      provinceLabel={t("customerManagement.modal.province")}
                      name="custom-customer-address"
                      inputClasses="py-3 px-4"
                    />
                    {customerDistance !== null && orderType === "delivery" && (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                          <LocationIcon className="size-4" />
                          <span>
                            {t("orderProcessingModal.customerSearch.distance", {
                              distance: customerDistance.toFixed(2),
                            })}
                          </span>
                        </div>
                        <CustomButton
                          type="button"
                          onClick={() => setIsRouteModalOpen(true)}
                          label={t("orderProcessingModal.customerSearch.viewRoute")}
                          size="xs"
                          variant="transparent"
                          className="text-blue-600 hover:bg-blue-50 py-1"
                          Icon={<CarIcon className="size-3" />}
                        />
                      </div>
                    )}
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
                        borderColor: "#000000",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000000",
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
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <LocationFilledIcon className="size-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-gray-800 mb-3">
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
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="text-gray-600 size-5" />
              </div>
              <h3 className="text-xl font-bold text-black">
                {t("orderProcessingModal.orderNotes.title")}
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent focus:outline-none text-lg touch-manipulation resize-none"
              rows={3}
              placeholder={t("orderProcessingModal.orderNotes.placeholder")}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-2 bg-gray-600"></div>
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
                    {item.variantName && item.variantId && (
                      <div className="text-sm text-gray-600 mt-1">
                        {t("orderProcessingModal.orderSummary.variant")}{" "}
                        {item.variantName}
                      </div>
                    )}
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
                                {/* <div className="text-xs text-gray-600 mb-1">
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
                              {item.variantName && item.variantId && (
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
                              )}
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
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-black">
                    {t("orderProcessingModal.orderSummary.total")}
                  </span>
                  <span className="text-3xl font-bold text-black px-6 py-3">
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
            className="flex-1 text-lg bg-gradient-to-r from-black to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-900"
            Icon={
              <span className="bg-white rounded-full size-5 flex justify-center items-center">
                <CheckIcon className="size-3 text-black" />
              </span>
            }
            label={t("orderProcessingModal.buttons.proceedOrder")}
          />
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        mode="add"
        onSuccess={handleNewCustomerCreated}
      />

      {/* Payment Option Modal */}
      <PaymentOptionModal
        isOpen={isPaymentOptionModalOpen}
        onClose={() => setIsPaymentOptionModalOpen(false)}
        onPayNow={handlePayNow}
        onPayLater={handlePayLater}
        totalAmount={orderTotal}
        orderType={
          orderType === "pickup" ||
          orderType === "web:pickup" ||
          orderType === "app:pickup"
            ? "pickup"
            : "dine-in"
        }
      />

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handlePaymentConfirm}
        totalAmount={orderTotal}
        existingPaymentType={order?.paymentType}
      />

      <DeliveryRouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        origin={configurations.address}
        destination={formatAddress(selectedCustomer?.address || customCustomerAddress)}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
      />
    </div>
  );
};

export default OrderProcessingModal;
