import React from "react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "../../ui/CustomSelect";
import { DeliveryPerson } from "@/types/delivery";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon } from "@/renderer/public/Svg";
import CustomInput from "../../shared/CustomInput";

interface DeliveryPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  deliveryPerson: DeliveryPerson | null;
  setDeliveryPerson: React.Dispatch<
    React.SetStateAction<DeliveryPerson | null>
  >;
  emailError: string;
  phoneError: string;
  handleEmailChange: (value: string) => void;
  handlePhoneChange: (value: string) => void;
  isEditing: boolean;
}

export const DeliveryPersonModal: React.FC<DeliveryPersonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  deliveryPerson,
  setDeliveryPerson,
  emailError,
  phoneError,
  handleEmailChange,
  handlePhoneChange,
  isEditing,
}) => {
  const { t } = useTranslation();
  const getVehicleTypeOptions = () => [
    { value: "bike", label: t("deliveryManagement.bike") },
    { value: "motorcycle", label: t("deliveryManagement.motorcycle") },
    { value: "car", label: t("deliveryManagement.car") },
    { value: "scooter", label: t("deliveryManagement.scooter") },
  ];

  if (!isOpen || !deliveryPerson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {isEditing
                ? t("deliveryPersonModal.editTitle")
                : t("deliveryPersonModal.addTitle")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-indigo-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomInput
              label={t("deliveryPersonModal.fullName")}
              name="name"
              type="text"
              placeholder={t("deliveryPersonModal.fullNamePlaceholder")}
              value={deliveryPerson.name}
              onChange={(e) =>
                setDeliveryPerson({ ...deliveryPerson, name: e.target.value })
              }
              inputClasses="py-3 px-4"
            />
            <CustomInput
              label={t("deliveryPersonModal.email")}
              name="email"
              type="text"
              placeholder={t("deliveryPersonModal.emailPlaceholder")}
              value={deliveryPerson.email || ""}
              onChange={(e) => handleEmailChange(e.target.value)}
              inputClasses={`py-3 px-4 ${emailError ? "border-red-300 focus:!ring-1 focus:ring-red-600 focus:border-red-600" : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"}`}
              error={emailError}
            />
            <CustomInput
              label={t("deliveryPersonModal.phoneNumber")}
              name="phone"
              type="text"
              placeholder={t("deliveryPersonModal.phoneNumberPlaceholder")}
              value={(deliveryPerson as any).phone || ""}
              onChange={(e) => handlePhoneChange(e.target.value)}
              inputClasses={`py-3 px-4 ${phoneError ? "border-red-300 focus:!ring-1 focus:ring-red-600 focus:border-red-600" : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"}`}
              error={phoneError}
            />
            <CustomInput
              label={t("deliveryPersonModal.licenseNumber")}
              name="licenseNo"
              type="text"
              placeholder={t("deliveryPersonModal.licenseNumberPlaceholder")}
              value={(deliveryPerson as any).licenseNo || ""}
              onChange={(e) =>
                setDeliveryPerson({
                  ...deliveryPerson,
                  licenseNo: e.target.value,
                } as any)
              }
              inputClasses="py-3 px-4"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("deliveryPersonModal.vehicleType")}
              </label>
              <CustomSelect
                options={getVehicleTypeOptions()}
                value={(deliveryPerson as any).vehicleType || "bike"}
                onChange={(value: string) =>
                  setDeliveryPerson({
                    ...deliveryPerson,
                    vehicleType: value,
                  } as any)
                }
                placeholder={t("deliveryPersonModal.selectVehicleType")}
                portalClassName="delivery-person-vehicle-type-dropdown-portal"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("deliveryPersonModal.cancel")}
              className="hover:scale-105"
            />
            <CustomButton
              type="submit"
              variant="primary"
              label={
                isEditing
                  ? t("deliveryPersonModal.updateDeliveryPerson")
                  : t("deliveryPersonModal.addDeliveryPerson")
              }
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
