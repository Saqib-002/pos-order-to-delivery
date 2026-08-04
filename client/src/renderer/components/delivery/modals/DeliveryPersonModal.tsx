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
  usernameError: string;
  phoneError: string;
  handleUsernameChange: (value: string) => void;
  handlePhoneChange: (value: string) => void;
  isEditing: boolean;
}

export const DeliveryPersonModal: React.FC<DeliveryPersonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  deliveryPerson,
  setDeliveryPerson,
  usernameError,
  phoneError,
  handleUsernameChange,
  handlePhoneChange,
  isEditing,
}) => {
  const { t } = useTranslation();
  const getVehicleTypeOptions = () => [
    { value: "bike", label: t("deliveryManagement.bike") },
    { value: "motorcycle", label: t("deliveryManagement.motorcycle") },
    { value: "car", label: t("deliveryManagement.car") },
    { value: "scooter", label: t("deliveryManagement.scooter") },
    { value: "van", label: t("deliveryManagement.van") },
  ];

  if (!isOpen || !deliveryPerson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl">
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
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
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
              label={t("deliveryPersonModal.username")}
              name="username"
              type="text"
              placeholder={t("deliveryPersonModal.usernamePlaceholder")}
              value={(deliveryPerson as any).username || ""}
              onChange={(e) => handleUsernameChange(e.target.value)}
              inputClasses={`py-3 px-4 ${usernameError ? "border-red-300 focus:!ring-1 focus:ring-red-600 focus:border-red-600" : "border-gray-300 focus:ring-black focus:border-black"}`}
              error={usernameError}
            />
            <CustomInput
              label={t("deliveryPersonModal.phoneNumber")}
              name="phone"
              type="text"
              placeholder={t("deliveryPersonModal.phoneNumberPlaceholder")}
              value={(deliveryPerson as any).phone || ""}
              onChange={(e) => handlePhoneChange(e.target.value)}
              inputClasses={`py-3 px-4 ${phoneError ? "border-red-300 focus:!ring-1 focus:ring-red-600 focus:border-red-600" : "border-gray-300 focus:ring-black focus:border-black"}`}
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
              <CustomInput
                label={`${t("deliveryPersonModal.password")}${!isEditing ? " *" : ""}`}
                name="password"
                type="password"
                placeholder={t("deliveryPersonModal.passwordPlaceholder")}
                value={(deliveryPerson as any).password || ""}
                onChange={(e) =>
                  setDeliveryPerson({
                    ...deliveryPerson,
                    password: e.target.value,
                  } as any)
                }
                inputClasses="py-3 px-4 border-gray-300 focus:ring-black focus:border-black"
              />
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("deliveryPersonModal.passwordHelpText")}
                </p>
              )}
            </div>
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
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  {t("deliveryPersonModal.status")}
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {(deliveryPerson as any).isActive !== false
                      ? t("deliveryPersonModal.active")
                      : t("deliveryPersonModal.inactive")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDeliveryPerson({
                        ...deliveryPerson,
                        isActive: !((deliveryPerson as any).isActive !== false),
                      } as any)
                    }
                    className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      (deliveryPerson as any).isActive !== false
                        ? "bg-black"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        (deliveryPerson as any).isActive !== false
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
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
              className="bg-black hover:scale-105"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
