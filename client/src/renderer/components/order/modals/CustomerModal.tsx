import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { Customer } from "@/types/order";
import { formatAddress } from "@/renderer/utils/utils";
import { useTranslation } from "react-i18next";

interface CustomerModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCustomerCreated?: (customer: Customer) => void;
}

const CustomerModal = ({
  setIsOpen,
  onCustomerCreated,
}: CustomerModalProps) => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const {
    auth: { token },
  } = useAuth();
  const fetchCustomers = debounce(async (phone: string) => {
    if (!phone || phone.length < 3) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await (window as any).electronAPI.getCustomersByPhone(
        token,
        phone
      );
      if (res.status) {
        setCustomers(res.data);
        setShowDropdown(true);
      } else {
        setCustomers([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setShowDropdown(false);
    }
  }, 500);
  useEffect(() => {
    if (!isSelected) {
      fetchCustomers(phone);
    } else {
      setCustomers([]);
      setShowDropdown(false);
    }
    return () => {
      fetchCustomers.cancel();
    };
  }, [phone]);
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setIsSelected(false);
  };
  const handlePhoneBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };
  const handleCustomerSelect = (customer: Customer) => {
    setIsSelected(true);
    setPhone(customer.phone);
    setShowDropdown(false);
    const form = document.querySelector("form");
    if (form) {
      (form.querySelector("[name='name']") as HTMLInputElement).value =
        customer.name || "";
      (form.querySelector("[name='cif']") as HTMLInputElement).value =
        customer.cif || "";
      (form.querySelector("[name='email']") as HTMLInputElement).value =
        customer.email || "";
      (form.querySelector("[name='comments']") as HTMLTextAreaElement).value =
        customer.comments || "";

      if (customer.address) {
        const addressObj = customer.address
          .split("|")
          .reduce((obj: Record<string, string>, pair: string) => {
            const [key, value] = pair.split("=");
            obj[key] = value;
            return obj;
          }, {});
        (form.querySelector("[name='address']") as HTMLTextAreaElement).value =
          addressObj.address || "";
        (form.querySelector("[name='postal']") as HTMLTextAreaElement).value =
          addressObj.postal || "";
        (form.querySelector("[name='city']") as HTMLTextAreaElement).value =
          addressObj.city || "";
        (form.querySelector("[name='province']") as HTMLTextAreaElement).value =
          addressObj.province || "";
      }
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here, e.g., add customer to order
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields
    const phone = (data.phone as string)?.trim();
    const address = (data.address as string)?.trim();
    const postal = (data.postal as string)?.trim();
    const city = (data.city as string)?.trim();

    if (!phone) {
      toast.error(t("customerModal.errors.phoneRequired"));
      return;
    }
    if (!address) {
      toast.error(t("customerModal.errors.addressRequired"));
      return;
    }
    if (!postal) {
      toast.error(t("customerModal.errors.postalCodeRequired"));
      return;
    }
    if (!city) {
      toast.error(t("customerModal.errors.cityRequired"));
      return;
    }

    const addressObj = {
      address: address,
      postal: postal,
      city: city,
      province: (data.province as string) || "",
    };
    const addressString = Object.entries(addressObj)
      .map(([key, value]) => `${key}=${value}`)
      .join("|");
    const customer: Customer = {
      name: (data.name as string) || "",
      phone: phone,
      address: addressString,
      cif: (data.cif as string) || "",
      email: (data.email as string) || "",
      comments: (data.comments as string) || "",
    };
    let res;
    if (!isEditing) {
      res = await (window as any).electronAPI.createCustomer(token, customer);
    } else {
      res = await (window as any).electronAPI.upsertCustomer(token, customer);
    }
    if (!res.status) {
      if (res.error.includes("customers_phone_unique")) {
        toast.error(t("customerModal.errors.customerAlreadyExists"));
        return;
      }
      toast.error(
        isEditing
          ? t("customerModal.errors.failedToEditCustomer")
          : t("customerModal.errors.failedToAddCustomer")
      );
      return;
    }

    // Call the callback with the created customer data
    if (onCustomerCreated) {
      const createdCustomer: Customer = {
        id: res.data.id,
        name: customer.name as string,
        phone: customer.phone as string,
        address: customer.address as string,
        cif: customer.cif as string,
        email: customer.email as string,
        comments: customer.comments as string,
        createdAt: res.data.createdAt,
        updatedAt: res.data.updatedAt,
      };
      onCustomerCreated(createdCustomer);
    } else {
      setIsOpen(false);
    }
  };
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-600">
              {t("customerModal.title")}
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="relative">
              <CustomInput
                type="tel"
                name="phone"
                label={t("customerModal.phone")}
                placeholder={t("customerModal.placeholders.phone")}
                otherClasses="mb-2"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {customers.map((customer, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      {customer.address && (
                        <p className="text-sm text-gray-500 truncate">
                          {formatAddress(customer.address)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                type="text"
                name="name"
                label={t("customerModal.name")}
                placeholder={t("customerModal.placeholders.name")}
                otherClasses="mb-2 col-span-2"
              />
              <CustomInput
                type="text"
                name="cif"
                label={t("customerModal.cifDni")}
                placeholder={t("customerModal.placeholders.cifDni")}
                otherClasses="mb-2 col-span-1"
              />
            </div>
            <CustomInput
              type="email"
              name="email"
              label={t("customerModal.email")}
              placeholder={t("customerModal.placeholders.email")}
              otherClasses="mb-2"
            />
            <div className="mb-2">
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("customerModal.comments")}
              </label>
              <textarea
                id="comments"
                name="comments"
                placeholder={t("customerModal.placeholders.comments")}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
              <CustomInput
                type="text"
                name="address"
                label={t("customerModal.address")}
                placeholder={t("customerModal.placeholders.address")}
              />

              <CustomInput
                type="text"
                name="postal"
                label={t("customerModal.postalCode")}
                placeholder={t("customerModal.placeholders.postalCode")}
              />
              <CustomInput
                type="text"
                name="city"
                label={t("customerModal.city")}
                placeholder={t("customerModal.placeholders.city")}
              />
              <CustomInput
                type="text"
                name="province"
                label={t("customerModal.province")}
                placeholder={t("customerModal.placeholders.province")}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <CustomButton
                label={t("common.cancel")}
                variant="secondary"
                onClick={() => setIsOpen(false)}
                type="button"
              />
              <CustomButton
                label={t("customerModal.addCustomer")}
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CustomerModal;
