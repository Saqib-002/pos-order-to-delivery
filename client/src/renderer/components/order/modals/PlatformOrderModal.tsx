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
import { CrossIcon } from "@/renderer/public/Svg";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { updateOrder } from "../../../utils/order";
import { Order } from "@/types/order";

interface Platform {
  id: string;
  name: string;
}

interface PlatformOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "add" | "edit";
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
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [ticketNumber, setTicketNumber] = useState<string>(""); // State for Ticket Number
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
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
      if (mode === "edit" && initialOrder) {
        const orderAny = initialOrder as any;
        setSelectedPlatformId(orderAny.platformId || "");
        setTicketNumber(orderAny.ticketNumber || ""); // Populate Ticket Number
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

        const paymentType = initialOrder.paymentType || "";
        setIsPaid(!paymentType.includes("pending"));
      }
    }
  }, [isOpen, mode, initialOrder]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatformId("");
      setTicketNumber(""); // Reset Ticket Number
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
      setIsPaid(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedPlatformId) {
      toast.error(t("platformOrders.errors.platformRequired"));
      setLoading(false);
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error(t("platformOrders.errors.priceRequired"));
      setLoading(false);
      return;
    }

    try {
      const selectedPlatform = platforms.find(
        (p) => p.id === selectedPlatformId
      );
      if (!selectedPlatform) {
        throw new Error("Platform not found");
      }

      const priceAmount = parseFloat(price);
      const paymentType = isPaid
        ? `cash:${priceAmount}`
        : "pending:0";

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
        ticketNumber: ticketNumber.trim(), // Include Ticket Number in payload
        customerName:
          customerName.trim() || t("platformOrders.platformCustomer"),
        customerPhone: customerPhone.trim() || "",
        customerAddress: formattedAddress || undefined,
        paymentType: paymentType,
        price: priceAmount,
        isPaid: isPaid,
        receivingTime: receivingTime ? receivingTime.toISOString() : null,
        notes: "",
      };

      let result;
      if (mode === "edit" && initialOrder) {
        result = await updateOrder(token, initialOrder.id, {
          platformId: selectedPlatformId,
          ticketNumber: orderData.ticketNumber, // Update Ticket Number
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          paymentType: orderData.paymentType,
          price: orderData.price,
          isPaid: orderData.isPaid,
          receivingTime: orderData.receivingTime,
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
      console.error("Error creating order:", error);
      toast.error(error.message || t("platformOrders.errors.createOrderError"));
    } finally {
      setLoading(false);
    }
  };

  const platformOptions = platforms.map((platform: Platform) => ({
    value: platform.id,
    label: platform.name,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold">
            {mode === "edit"
              ? t("platformOrders.modal.editTitle")
              : t("platformOrders.modal.title")}
          </h3>
          <CustomButton
            type="button"
            variant="transparent"
            onClick={onClose}
            Icon={<CrossIcon className="size-5" />}
            className="!p-0"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
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
                  {t("Ticket Number")} {/* Add translation key if available */}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("platformOrders.price")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {t("platformOrders.isPaid")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      isPaid ? "bg-black" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        isPaid ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <CustomInput
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("platformOrders.enterPrice")}
                required
                inputClasses="py-3 px-4"
              />
            </div>

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
                searchAddressLabel={t("customerManagement.modal.searchAddress")}
                apartmentLabel={t("customerManagement.modal.apartment")}
                postalCodeLabel={t("customerManagement.modal.postalCode")}
                cityLabel={t("customerManagement.modal.city")}
                provinceLabel={t("customerManagement.modal.province")}
                name="platform-order-address"
                inputClasses="py-3 px-4"
              />
            </div>

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

          <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
            <CustomButton
              type="button"
              label={t("common.cancel")}
              onClick={onClose}
              variant="transparent"
              className="border border-gray-300"
            />
            <CustomButton
              type="submit"
              label={
                mode === "edit"
                  ? t("platformOrders.updateOrder")
                  : t("platformOrders.registerOrder")
              }
              className="bg-black hover:scale-105"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformOrderModal;