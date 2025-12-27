import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Vehicle } from "@/types/vehicles";
import { DeliveryPerson } from "@/types/delivery";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import { DatePicker } from "../../ui/DatePicker";
import { CrossIcon } from "../../../public/Svg";

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Vehicle>) => Promise<boolean>;
  initialData?: Vehicle | null;
  drivers: DeliveryPerson[];
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  drivers,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    type: "bike",
    hasGps: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ type: "bike", hasGps: false });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    if (!formData.model || !formData.licensePlate) {
      // You might want to trigger a toast here if validation fails
      return;
    }
    const success = await onSubmit(formData);
    if (success) onClose();
  };

  if (!isOpen) return null;

  const driverOptions = [
    { value: "", label: t("vehicleManagement.modal.selectDriver") },
    ...drivers.map((d) => ({ value: d.id, label: d.name })),
  ];
  const typeOptions = [
    { value: "bike", label: t("vehicleManagement.filters.bike") },
    { value: "car", label: t("vehicleManagement.filters.car") },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {initialData
                ? t("vehicleManagement.modal.editVehicle")
                : t("vehicleManagement.modal.addVehicle")}
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

        <div className="p-8 grid grid-cols-3 gap-4">
          <CustomInput
            name="model"
            type="text"
            label={t("vehicleManagement.modal.modelRequired")}
            placeholder={t("vehicleManagement.modal.modelPlaceholder")}
            value={formData.model || ""}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="licensePlate"
            type="text"
            label={t("vehicleManagement.modal.licensePlateRequired")}
            placeholder={t("vehicleManagement.modal.licensePlatePlaceholder")}
            value={formData.licensePlate || ""}
            onChange={(e) =>
              setFormData({ ...formData, licensePlate: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="color"
            type="text"
            label={t("vehicleManagement.modal.color")}
            placeholder={t("vehicleManagement.modal.colorPlaceholder")}
            value={formData.color || ""}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            inputClasses="py-2"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("vehicleManagement.modal.type")}
            </label>
            <CustomSelect
              options={typeOptions}
              value={formData.type || "bike"}
              onChange={(val) => setFormData({ ...formData, type: val as any })}
              placeholder={t("vehicleManagement.modal.selectType")}
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("vehicleManagement.modal.assignDriver")}
            </label>
            <CustomSelect
              options={driverOptions}
              value={formData.driverId || ""}
              onChange={(val) => setFormData({ ...formData, driverId: val })}
              placeholder={t("vehicleManagement.modal.selectDriver")}
            />
          </div>

          <div className="col-span-1 flex items-center mt-2">
            <input
              type="checkbox"
              id="hasGps"
              checked={formData.hasGps}
              onChange={(e) =>
                setFormData({ ...formData, hasGps: e.target.checked })
              }
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black accent-black mr-2"
            />
            <label htmlFor="hasGps" className="text-sm text-gray-700">
              {t("vehicleManagement.modal.hasGps")}
            </label>
          </div>

          <DatePicker
            label={t("vehicleManagement.modal.itvDate")}
            value={formData.itvDate}
            onChange={(value) => setFormData({ ...formData, itvDate: value })}
            placeholder="Select ITV date"
          />
          <DatePicker
            label={t("vehicleManagement.modal.insuranceDate")}
            value={formData.insuranceDate}
            onChange={(value) =>
              setFormData({ ...formData, insuranceDate: value })
            }
            placeholder="Select insurance date"
          />
          <CustomInput
            name="insuranceNumber"
            type="text"
            label={t("vehicleManagement.modal.insuranceNumber")}
            placeholder={t(
              "vehicleManagement.modal.insuranceNumberPlaceholder"
            )}
            value={formData.insuranceNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, insuranceNumber: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="insuranceCompany"
            type="text"
            label={t("vehicleManagement.modal.insuranceCompany")}
            placeholder={t(
              "vehicleManagement.modal.insuranceCompanyPlaceholder"
            )}
            value={formData.insuranceCompany || ""}
            onChange={(e) =>
              setFormData({ ...formData, insuranceCompany: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="insurancePrice"
            type="number"
            label={t("vehicleManagement.modal.insurancePrice")}
            placeholder={t("vehicleManagement.modal.insurancePricePlaceholder")}
            value={formData.insurancePrice?.toString() || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                insurancePrice: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            inputClasses="py-2"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("vehicleManagement.modal.insurancePaymentTerm")}
            </label>
            <CustomSelect
              options={[
                {
                  value: "monthly",
                  label: t("vehicleManagement.modal.monthly"),
                },
                { value: "yearly", label: t("vehicleManagement.modal.yearly") },
              ]}
              value={formData.insurancePaymentTerm || ""}
              onChange={(val) =>
                setFormData({ ...formData, insurancePaymentTerm: val as any })
              }
              placeholder={t("vehicleManagement.modal.selectPaymentTerm")}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={onClose}
            label={t("vehicleManagement.modal.cancel")}
            className="hover:scale-105"
          />
          <CustomButton
            type="button"
            onClick={handleSubmit}
            label={t("vehicleManagement.modal.saveVehicle")}
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};
