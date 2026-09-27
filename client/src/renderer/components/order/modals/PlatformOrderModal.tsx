import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CustomSelect } from "../../ui/CustomSelect";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { AddressAutocomplete } from "../../shared/AddressAutocomplete";
import { CrossIcon, OutlineCreditCardIcon } from "@/renderer/public/Svg";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { updateOrder } from "../../../utils/order";
import { Order } from "@/types/order";

interface Platform {
  id: string;
  name: string;
}

interface PaymentMethod {
  type: "cash" | "card";
  amount: number;
  customerGiven?: number;
}

interface PlatformOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "add" | "edit" | "create";
  initialOrder?: Order | null;
}

const PlatformOrderModal: React.FC<PlatformOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = "add",
  initialOrder = null,
}) => {
  const { t } = useTranslation();
  const {
    auth: { token },
  } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [addressFields, setAddressFields] = useState({
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    province: "",
  });
  const [receivingTime, setReceivingTime] = useState<Dayjs | null>(null);
  const [orderType, setOrderType] = useState<
    "platform:delivery" | "platform:pickup"
  >("platform:delivery");
  const [loading, setLoading] = useState(false);

  // Step 2 Standard Payment state (matching PaymentProcessingModal)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"cash" | "card">("cash");

  const priceAmount = parseFloat(price) || 0;
  const remainingAmount = Math.max(
    0,
    priceAmount -
      paymentMethods.reduce((sum, method) => sum + method.amount, 0)
  );
  const totalPaid = paymentMethods.reduce(
    (sum, method) => sum + method.amount,
    0
  );
  const totalCustomerGiven = paymentMethods.reduce(
    (sum, method) => sum + (method.customerGiven || 0),
    0
  );
  const changeAmount = Math.max(0, totalCustomerGiven - priceAmount);

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
      setStep(1);

      if (mode === "edit" && initialOrder) {
        const orderAny = initialOrder as any;
        setSelectedPlatformId(orderAny.platformId || "");
        setTicketNumber(orderAny.ticketNumber || "");
        setCustomerName(orderAny.customer?.name || orderAny.customerName || "");
        setCustomerPhone(
          orderAny.customer?.phone || orderAny.customerPhone || ""
        );

        const { orderTotal } = calculateOrderTotal(initialOrder.items || []);
        setPrice(orderTotal.toString());

        const customerAddress =
          orderAny.customer?.address || orderAny.customerAddress || "";
        setAddress(customerAddress);

        if (customerAddress.includes("|")) {
          const parts = customerAddress.split("|");
          const addressObj: any = {};
          parts.forEach((part: string) => {
            const [key, value] = part.split("=");
            if (key) addressObj[key] = value || "";
          });
          setAddressFields({
            address: addressObj.address || customerAddress,
            apartment: addressObj.apartment || "",
            postalCode: addressObj.postal || "",
            city: addressObj.city || "",
            province: addressObj.province || "",
          });
        } else {
          setAddressFields({
            address: customerAddress,
            apartment: "",
            postalCode: "",
            city: "",
            province: "",
          });
        }

        if (orderAny.receivingTime) {
          setReceivingTime(dayjs(orderAny.receivingTime));
        }

        if (
          initialOrder.orderType === "platform:delivery" ||
          initialOrder.orderType === "platform:pickup"
        ) {
          setOrderType(initialOrder.orderType);
        } else {
          setOrderType("platform:delivery");
        }

        // Parse existing payments
        const paymentType = initialOrder.paymentType || "";
        if (
          paymentType &&
          paymentType !== "pending" &&
          !paymentType.startsWith("pending:")
        ) {
          try {
            const existingPayments: PaymentMethod[] = paymentType
              .split(", ")
              .map((p: string) => {
                const [type, amount] = p.split(":");
                return {
                  type: type.trim() as "cash" | "card",
                  amount: parseFloat(amount) || 0,
                  customerGiven: parseFloat(amount) || 0,
                };
              })
              .filter((p: PaymentMethod) => p.amount > 0);

            setPaymentMethods(existingPayments);
          } catch (e) {
            setPaymentMethods([]);
          }
        } else {
          setPaymentMethods([]);
        }
      } else {
        setPaymentMethods([]);
        setCurrentAmount(0);
        setSelectedType("cash");
      }
    }
  }, [isOpen, mode, initialOrder]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatformId("");
      setTicketNumber("");
      setCustomerName("");
      setCustomerPhone("");
      setPrice("");
      setAddress("");
      setAddressFields({
        address: "",
        apartment: "",
        postalCode: "",
        city: "",
        province: "",
      });
      setReceivingTime(null);
      setOrderType("platform:delivery");
      setStep(1);
      setPaymentMethods([]);
      setCurrentAmount(0);
      setSelectedType("cash");
    }
  }, [isOpen]);

  const fetchPlatforms = async () => {
    if (!token) return;
    try {
      const res = await (window as any).electronAPI.getAllPlatforms(token);
      if (res.status) {
        setPlatforms(res.data || []);
      } else {
        toast.error(t("platformOrders.errors.fetchPlatformsError"));
      }
    } catch (error) {
      toast.error(t("platformOrders.errors.fetchPlatformsError"));
    }
  };

  const handleSubmitOrder = async () => {
    if (loading) return;

    const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId);
    if (!selectedPlatform) {
      toast.error(
        t("platformOrders.errors.selectPlatformRequired") ||
          "Platform not found"
      );
      return;
    }

    let paymentTypeString = "pending:0";
    let isPaid = false;

    if ((mode === "add" || mode === "create") && orderType === "platform:delivery") {
      paymentTypeString = "pending:0";
      isPaid = false;
    } else if (paymentMethods.length > 0) {
      paymentTypeString = paymentMethods
        .map((method) => `${method.type}:${method.amount.toFixed(2)}`)
        .join(", ");
      isPaid = totalPaid >= priceAmount;
    } else {
      paymentTypeString = "pending:0";
      isPaid = false;
    }

    let formattedAddress = "";
    if (addressFields.address.trim()) {
      formattedAddress = `address=${addressFields.address.trim()}|postal=${addressFields.postalCode.trim()}|city=${addressFields.city.trim()}|province=${addressFields.province.trim()}`;
      if (addressFields.apartment.trim()) {
        formattedAddress += `|apartment=${addressFields.apartment.trim()}`;
      }
    } else if (address.trim()) {
      formattedAddress = address.trim();
    }

    const orderData = {
      platformId: selectedPlatformId,
      ticketNumber: ticketNumber.trim(),
      customerName: customerName.trim() || t("platformOrders.platformCustomer"),
      customerPhone: customerPhone.trim() || "",
      customerAddress: formattedAddress || undefined,
      paymentType: paymentTypeString,
      price: priceAmount,
      isPaid: isPaid,
      orderType: orderType,
      receivingTime: receivingTime ? receivingTime.toISOString() : null,
      notes: "",
    };

    setLoading(true);
    try {
      let result;
      if (mode === "edit" && initialOrder) {
        const isTransitioningToNonDelivery =
          orderType === "platform:pickup" &&
          initialOrder.orderType === "platform:delivery";
        const isTransitioningToDelivery =
          orderType === "platform:delivery" &&
          initialOrder.orderType === "platform:pickup";

        let finalStatus = initialOrder.status;
        let deliveryPerson: any = (initialOrder as any).deliveryPerson;
        let assignedAt: any = initialOrder.assignedAt;
        let deliveredAt: any = initialOrder.deliveredAt;

        const finalStatusLower = finalStatus?.toLowerCase();
        if (isTransitioningToNonDelivery) {
          if (
            finalStatusLower === "ready for delivery" ||
            finalStatusLower === "out for delivery"
          ) {
            finalStatus = "completed";
          }
          deliveryPerson = null;
          assignedAt = null;
          deliveredAt = null;
        } else if (isTransitioningToDelivery) {
          if (
            finalStatusLower === "completed" ||
            finalStatusLower === "complete"
          ) {
            finalStatus = "ready for delivery";
            assignedAt = null;
            deliveredAt = null;
          }
        }

        result = await updateOrder(token, initialOrder.id, {
          platformId: selectedPlatformId,
          ticketNumber: orderData.ticketNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          paymentType: orderData.paymentType,
          price: orderData.price,
          isPaid: orderData.isPaid,
          orderType: orderData.orderType,
          receivingTime: orderData.receivingTime,
          status: finalStatus,
          deliveryPerson: deliveryPerson,
          assignedAt: assignedAt,
          deliveredAt: deliveredAt,
        });
        if (!result) {
          throw new Error("Failed to update order");
        }
        toast.success(t("platformOrders.messages.orderUpdatedSuccessfully"));
      } else {
        result = await (window as any).electronAPI.createPlatformOrder(
          token,
          orderData
        );

        if (!result || !result.status) {
          throw new Error(result?.error || "Failed to create order");
        }

        toast.success(t("platformOrders.messages.orderCreatedSuccessfully"));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving platform order:", error);
      toast.error(error.message || t("platformOrders.errors.createOrderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatformId) {
      toast.error(
        t("platformOrders.errors.selectPlatformRequired") ||
          "Please select a platform"
      );
      return;
    }

    if (!price || priceAmount <= 0) {
      toast.error(
        t("platformOrders.errors.validPriceRequired") ||
          "Please enter a valid price"
      );
      return;
    }

    if ((mode === "add" || mode === "create") && orderType === "platform:delivery") {
      handleSubmitOrder();
      return;
    }

    if (paymentMethods.length === 0) {
      setCurrentAmount(parseFloat(priceAmount.toFixed(2)));
    }

    setStep(2);
  };

  const handleAddPayment = () => {
    if (currentAmount <= 0) {
      toast.error(t("paymentProcessingModal.errors.pleaseEnterValidAmount"));
      return;
    }

    const actualAmount = Math.min(currentAmount, remainingAmount);

    if (actualAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.noRemainingAmount") ||
          "No remaining amount to pay. The total has already been paid."
      );
      return;
    }

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      updatedMethods[existingMethodIndex].customerGiven =
        (updatedMethods[existingMethodIndex].customerGiven || 0) +
        currentAmount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        {
          type: selectedType,
          amount: actualAmount,
          customerGiven: currentAmount,
        },
      ]);
    }

    setCurrentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };



  if (!isOpen) return null;

  const platformOptions = platforms.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const orderTypeOptions = [
    {
      label:
        t("orderTypes.platformDelivery") ||
        t("orderTypes.delivery") ||
        "Delivery",
      value: "platform:delivery",
    },
    {
      label:
        t("orderTypes.platformPickup") || t("orderTypes.pickup") || "Pickup",
      value: "platform:pickup",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-t-2xl shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <OutlineCreditCardIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {mode === "edit"
                  ? t("platformOrders.modal.editTitle")
                  : t("platformOrders.modal.title")}
              </h2>
              <p className="text-gray-200 text-sm">
                {step === 1
                  ? t("platformOrders.stepDetailsDescription") ||
                    "Enter order details and customer information"
                  : t("paymentProcessingModal.subtitle") ||
                    "Choose payment method and amount"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation cursor-pointer"
          >
            <CrossIcon className="size-6" />
          </button>
        </div>

        {/* Modal Body */}
        {step === 1 ? (
          /* STEP 1: ORDER DETAILS FORM */
          <form
            onSubmit={handleNextStep}
            className="flex-1 overflow-y-auto p-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("platformOrders.platformName")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    options={platformOptions}
                    value={selectedPlatformId}
                    onChange={(value: string) => setSelectedPlatformId(value)}
                    placeholder={t("platformOrders.selectPlatform")}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("Ticket Number") || "Ticket Number"}
                  </label>
                  <CustomInput
                    type="text"
                    name="ticketNumber"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="e.g. #12345"
                    inputClasses="py-3 px-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("orderTypes.title") || "Order Type"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    options={orderTypeOptions}
                    value={orderType}
                    onChange={(value: string) => setOrderType(value as any)}
                    placeholder={
                      t("orderTypes.selectOrderType") || "Select order type"
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("platformOrders.price")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t("platformOrders.enterPrice") || "0.00"}
                    required
                    inputClasses="py-2 px-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("platformOrders.customerName")}
                  </label>
                  <CustomInput
                    type="text"
                    name="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("platformOrders.enterCustomerName")}
                    inputClasses="py-3 px-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("platformOrders.customerPhone")}
                  </label>
                  <CustomInput
                    type="tel"
                    name="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t("platformOrders.enterCustomerPhone")}
                    inputClasses="py-3 px-4"
                  />
                </div>
              </div>

              {orderType === "platform:delivery" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("platformOrders.address")}
                  </label>
                  <AddressAutocomplete
                    value={addressFields.address}
                    onChange={(value) => {
                      setAddressFields((prev) => {
                        const updated = { ...prev, address: value };
                        if (value.trim()) {
                          let addressString = `address=${value}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}`;
                          if (updated.apartment.trim()) {
                            addressString += `|apartment=${updated.apartment}`;
                          }
                          setAddress(addressString);
                        } else {
                          setAddress("");
                        }
                        return updated;
                      });
                    }}
                    onAddressSelect={(components) => {
                      let addressString = `address=${components.address}|postal=${components.postalCode}|city=${components.city}|province=${components.province}`;
                      if (components.apartment) {
                        addressString += `|apartment=${components.apartment}`;
                      }
                      setAddress(addressString);
                      setAddressFields({
                        address: components.address,
                        apartment: components.apartment || "",
                        postalCode: components.postalCode,
                        city: components.city,
                        province: components.province,
                      });
                    }}
                    apartmentValue={addressFields.apartment}
                    postalCodeValue={addressFields.postalCode}
                    cityValue={addressFields.city}
                    provinceValue={addressFields.province}
                    onApartmentChange={(value) => {
                      setAddressFields((prev) => {
                        const updated = { ...prev, apartment: value };
                        if (updated.address.trim()) {
                          let addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}`;
                          if (updated.apartment.trim()) {
                            addressString += `|apartment=${updated.apartment}`;
                          }
                          setAddress(addressString);
                        }
                        return updated;
                      });
                    }}
                    onPostalCodeChange={(value) => {
                      setAddressFields((prev) => {
                        const updated = { ...prev, postalCode: value };
                        if (updated.address.trim()) {
                          let addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}`;
                          if (updated.apartment.trim()) {
                            addressString += `|apartment=${updated.apartment}`;
                          }
                          setAddress(addressString);
                        }
                        return updated;
                      });
                    }}
                    onCityChange={(value) => {
                      setAddressFields((prev) => {
                        const updated = { ...prev, city: value };
                        if (updated.address.trim()) {
                          let addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}`;
                          if (updated.apartment.trim()) {
                            addressString += `|apartment=${updated.apartment}`;
                          }
                          setAddress(addressString);
                        }
                        return updated;
                      });
                    }}
                    onProvinceChange={(value) => {
                      setAddressFields((prev) => {
                        const updated = { ...prev, province: value };
                        if (updated.address.trim()) {
                          let addressString = `address=${updated.address}|postal=${updated.postalCode}|city=${updated.city}|province=${updated.province}`;
                          if (updated.apartment.trim()) {
                            addressString += `|apartment=${updated.apartment}`;
                          }
                          setAddress(addressString);
                        }
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
                    name="platform-order-address"
                    inputClasses="py-3 px-4"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("platformOrders.receivingTime")}
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileTimePicker
                    value={receivingTime}
                    onChange={(newValue) => setReceivingTime(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <CustomButton
                type="button"
                label={t("common.cancel")}
                onClick={onClose}
                variant="secondary"
                className="w-full py-3 px-4 text-lg"
              />
              <CustomButton
                type="submit"
                label={
                  (mode === "add" || mode === "create") && orderType === "platform:delivery"
                    ? (t("platformOrders.registerOrder") || "Register Order")
                    : (t("platformOrders.nextPayment") || "Continue to Payment")
                }
                className="w-full py-3 px-4 text-lg"
                disabled={loading}
              />
            </div>
          </form>
        ) : (
          /* STEP 2: STANDARD PAYMENT PROCESSING (Matching PaymentProcessingModal) */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Total Amount Summary Box */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">
                    {t("paymentProcessingModal.totalAmount")}:
                  </span>
                  <span className="text-2xl font-bold text-gray-600">
                    €{priceAmount.toFixed(2)}
                  </span>
                </div>
                {paymentMethods.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">
                      {t("paymentProcessingModal.alreadyPaid")}:
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      €{totalPaid.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {t("paymentProcessingModal.remaining")}:
                  </span>
                  <span
                    className={`text-lg font-semibold ${
                      remainingAmount > 0.01 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    €{remainingAmount.toFixed(2)}
                  </span>
                </div>
                {totalCustomerGiven > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-normal text-gray-600">
                      {t("paymentProcessingModal.amountTendered")}:
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      €{totalCustomerGiven.toFixed(2)}
                    </span>
                  </div>
                )}
                {changeAmount > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-normal text-gray-600">
                      {t("paymentProcessingModal.changeToReturn")}:
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      €{changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method Selection (Cash & Card with icons) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  {t("paymentProcessingModal.paymentMethod")}
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedType("cash")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors touch-manipulation cursor-pointer ${
                      selectedType === "cash"
                        ? "border-green-400 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src="./images/cash.png"
                        alt="cash"
                        className="w-8 h-8"
                      />
                      <span className="font-medium text-lg">
                        {t("paymentProcessingModal.cash")}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("card");
                      if (remainingAmount > 0) {
                        setCurrentAmount(
                          parseFloat(remainingAmount.toFixed(2))
                        );
                      }
                    }}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors touch-manipulation cursor-pointer ${
                      selectedType === "card"
                        ? "border-blue-400 bg-blue-50 text-blue-800"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src="./images/card.png"
                        alt="card"
                        className="w-8 h-8"
                      />
                      <span className="font-medium text-lg">
                        {t("paymentProcessingModal.card")}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <CustomInput
                  label={t("paymentProcessingModal.amount")}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPayment();
                    }
                  }}
                  value={currentAmount || ""}
                  onChange={(e) =>
                    setCurrentAmount(parseFloat(e.target.value) || 0)
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  name="price"
                  inputClasses="py-3 px-4 text-xl text-center font-semibold focus:!ring-1"
                />
                <CustomButton
                  onClick={handleAddPayment}
                  type="button"
                  label={t("paymentProcessingModal.addPayment")}
                  className="w-full py-3 px-4 text-lg"
                />
              </div>

              {/* Added Payments List */}
              {paymentMethods.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">
                    {t("paymentProcessingModal.addedPayments")}
                  </h3>
                  <div className="space-y-2">
                    {paymentMethods.map((method, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              method.type === "cash"
                                ? "./images/cash.png"
                                : "./images/card.png"
                            }
                            alt={method.type}
                            className="w-6 h-6"
                          />
                          <div>
                            <div className="font-medium text-gray-800 capitalize text-lg">
                              {method.type === "cash"
                                ? t("paymentProcessingModal.cash")
                                : t("paymentProcessingModal.card")}
                            </div>
                            <div className="text-sm text-gray-600">
                              €{method.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(index)}
                          className="cursor-pointer p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                        >
                          <CrossIcon className="size-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-200 shrink-0">
              <div className="flex gap-3">
                <CustomButton
                  type="button"
                  label={t("common.back") || "Back"}
                  onClick={() => setStep(1)}
                  variant="secondary"
                  className="w-full py-3 px-4 text-lg"
                />
                <CustomButton
                  type="button"
                  label={t("common.cancel")}
                  onClick={onClose}
                  variant="secondary"
                  className="w-full py-3 px-4 text-lg"
                />
                <CustomButton
                  type="button"
                  label={
                    mode === "edit"
                      ? t("platformOrders.updateOrder") || "Update Order"
                      : paymentMethods.length > 0
                      ? t("paymentProcessingModal.processPayment") ||
                        "Process Payment"
                      : t("platformOrders.registerOrder") ||
                        "Confirm & Register Order"
                  }
                  onClick={handleSubmitOrder}
                  className="w-full py-3 px-4 text-lg"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformOrderModal;
