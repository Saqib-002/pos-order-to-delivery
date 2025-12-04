import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { Customer } from "@/types/order";
import { useTranslation } from "react-i18next";
import { AddressAutocomplete } from "../../shared/AddressAutocomplete";
import { CrossIcon } from "@/renderer/public/Svg";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  initialCustomer?: Customer | null;
  onSuccess?: (customer: Customer) => void;
}

const CustomerModal = ({
  isOpen,
  onClose,
  mode = "add",
  initialCustomer = null,
  onSuccess,
}: CustomerModalProps) => {
  const { t } = useTranslation();
  const {
    auth: { token },
  } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    province: "",
    email: "",
    cif: "",
    comments: "",
    id: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialCustomer) {
        const address = initialCustomer.address || "";
        let parsedAddress = "";
        let parsedApartment = "";
        let parsedPostalCode = "";
        let parsedCity = "";
        let parsedProvince = "";

        if (address.includes("|")) {
          const parts = address.split("|");
          parts.forEach((part) => {
            const [key, value] = part.split("=");
            if (key === "address") parsedAddress = value || "";
            if (key === "apartment") parsedApartment = value || "";
            if (key === "postal") parsedPostalCode = value || "";
            if (key === "city") parsedCity = value || "";
            if (key === "province") parsedProvince = value || "";
          });
        } else {
          parsedAddress = address;
        }

        setFormData({
          id: initialCustomer.id || "",
          name: initialCustomer.name,
          phone: initialCustomer.phone,
          address: parsedAddress,
          apartment: parsedApartment,
          postalCode: parsedPostalCode,
          city: parsedCity,
          province: parsedProvince,
          email: initialCustomer.email || "",
          cif: initialCustomer.cif || "",
          comments: initialCustomer.comments || "",
        });
      } else {
        // Reset form for add mode
        setFormData({
          name: "",
          phone: "",
          address: "",
          apartment: "",
          postalCode: "",
          city: "",
          province: "",
          email: "",
          cif: "",
          comments: "",
          id: "",
        });
      }
    }
  }, [isOpen, mode, initialCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("customerManagement.validation.nameRequired"));
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("customerManagement.validation.phoneRequired"));
      return;
    }
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error(t("customerManagement.validation.phoneInvalid"));
      return;
    }
    if (!formData.address.trim()) {
      toast.error(t("customerManagement.validation.addressRequired"));
      return;
    }
    if (!formData.postalCode.trim()) {
      toast.error(t("customerManagement.validation.postalCodeRequired"));
      return;
    }
    if (!formData.city.trim()) {
      toast.error(t("customerManagement.validation.cityRequired"));
      return;
    }
    if (!formData.province.trim()) {
      toast.error(t("customerManagement.validation.provinceRequired"));
      return;
    }

    // Combine address fields into pipe-separated format
    let addressString = `address=${formData.address.trim()}|postal=${formData.postalCode.trim()}|city=${formData.city.trim()}|province=${formData.province.trim()}`;
    if (formData.apartment.trim()) {
      addressString += `|apartment=${formData.apartment.trim()}`;
    }

    if (mode === "add") {
      try {
        const res = await (window as any).electronAPI.createCustomer(token, {
          name: formData.name,
          phone: formData.phone,
          address: addressString,
          email: formData.email || "",
          cif: formData.cif || "",
          comments: formData.comments || "",
        });
        if (!res.status) {
          toast.error(
            res.error.includes("UNIQUE constraint")
              ? t("customerManagement.messages.phoneTaken")
              : t("customerManagement.messages.addFailed")
          );
          return;
        }
        const customer = res.data;
        toast.success(t("customerManagement.messages.added"));
        if (onSuccess) {
          onSuccess(customer);
        }
        onClose();
      } catch (error) {
        toast.error(t("customerManagement.messages.addFailed"));
      }
    } else {
      try {
        const res = await (window as any).electronAPI.updateCustomerById(
          token,
          formData.id,
          {
            name: formData.name,
            phone: formData.phone,
            address: addressString,
            email: formData.email || "",
            cif: formData.cif || "",
            comments: formData.comments || "",
          }
        );
        if (!res.status) {
          toast.error(t("customerManagement.messages.updateFailed"));
          return;
        }
        const customer = res.data;
        toast.success(t("customerManagement.messages.updated"));
        if (onSuccess) {
          onSuccess(customer);
        }
        onClose();
      } catch (error) {
        toast.error(t("customerManagement.messages.updateFailed"));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {mode === "add"
                ? t("customerManagement.modal.addNew")
                : t("customerManagement.modal.edit")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput
                label={`${t("customerManagement.modal.name")} *`}
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("customerManagement.modal.name")}
                inputClasses="py-3 px-4"
              />
              <CustomInput
                label={`${t("customerManagement.modal.phone")} *`}
                type="text"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setFormData({ ...formData, phone: value });
                }}
                placeholder={t("customerManagement.modal.phone")}
                inputClasses="py-3 px-4"
              />
              <CustomInput
                label={t("customerManagement.modal.email")}
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t("customerManagement.modal.email")}
                inputClasses="py-3 px-4"
              />
              <CustomInput
                label={t("customerManagement.modal.cif")}
                type="text"
                name="cif"
                value={formData.cif}
                onChange={(e) =>
                  setFormData({ ...formData, cif: e.target.value })
                }
                placeholder={t("customerManagement.modal.cif")}
                inputClasses="py-3 px-4"
              />
              <div className="md:col-span-2">
                <AddressAutocomplete
                  label={t("customerManagement.modal.address")}
                  name="address"
                  value={formData.address}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, address: value }))
                  }
                  onAddressSelect={(components) => {
                    setFormData((prev) => ({
                      ...prev,
                      address: components.address,
                      apartment: components.apartment || "",
                      postalCode: components.postalCode,
                      city: components.city,
                      province: components.province,
                    }));
                  }}
                  apartmentValue={formData.apartment}
                  postalCodeValue={formData.postalCode}
                  cityValue={formData.city}
                  provinceValue={formData.province}
                  onApartmentChange={(value) =>
                    setFormData((prev) => ({ ...prev, apartment: value }))
                  }
                  onPostalCodeChange={(value) =>
                    setFormData((prev) => ({ ...prev, postalCode: value }))
                  }
                  onCityChange={(value) =>
                    setFormData((prev) => ({ ...prev, city: value }))
                  }
                  onProvinceChange={(value) =>
                    setFormData((prev) => ({ ...prev, province: value }))
                  }
                  searchAddressLabel={t(
                    "customerManagement.modal.searchAddress"
                  )}
                  apartmentLabel={t("customerManagement.modal.apartment")}
                  postalCodeLabel={t("customerManagement.modal.postalCode")}
                  cityLabel={t("customerManagement.modal.city")}
                  provinceLabel={t("customerManagement.modal.province")}
                  placeholder={t("customerManagement.modal.address")}
                  required
                  inputClasses="py-3 px-4"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("customerManagement.modal.comments")}
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  placeholder={t("customerManagement.modal.comments")}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 p-4 flex-shrink-0 border-t border-gray-200">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("customerManagement.modal.cancel")}
              className="hover:scale-105"
            />
            <CustomButton
              type="submit"
              variant="primary"
              label={
                mode === "add"
                  ? t("customerManagement.modal.add")
                  : t("customerManagement.modal.update")
              }
              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
