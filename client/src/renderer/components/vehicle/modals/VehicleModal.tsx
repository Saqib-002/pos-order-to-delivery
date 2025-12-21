import React, { useState, useEffect } from "react";
import { Vehicle } from "@/types/vehicles";
import { DeliveryPerson } from "@/types/delivery";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
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

  const driverOptions = drivers.map((d) => ({ value: d.id, label: d.name }));
  const typeOptions = [
    { value: "bike", label: "Bike" },
    { value: "car", label: "Car" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {initialData ? "Edit Vehicle" : "Add Vehicle"}
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

        <div className="p-8 grid grid-cols-2 gap-4">
          <CustomInput
            name="model"
            type="text"
            label="Model *"
            value={formData.model || ""}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            inputClasses="py-2"
          />
          <CustomInput
            name="licensePlate"
            type="text"
            label="License Plate *"
            value={formData.licensePlate || ""}
            onChange={(e) =>
              setFormData({ ...formData, licensePlate: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="color"
            type="text"
            label="Color"
            value={formData.color || ""}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            inputClasses="py-2"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <CustomSelect
              options={typeOptions}
              value={formData.type || "bike"}
              onChange={(val) => setFormData({ ...formData, type: val as any })}
              placeholder="Select Type"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Driver
            </label>
            <CustomSelect
              options={driverOptions}
              value={formData.driverId || ""}
              onChange={(val) => setFormData({ ...formData, driverId: val })}
              placeholder="Select Driver"
            />
          </div>

          <div className="col-span-2 flex items-center mt-2">
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
              Vehicle has GPS installed
            </label>
          </div>

          <CustomInput
            name="itvDate"
            type="date"
            label="ITV Date"
            value={
              formData.itvDate
                ? new Date(formData.itvDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              setFormData({ ...formData, itvDate: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            name="insuranceDate"
            type="date"
            label="Insurance Date"
            value={
              formData.insuranceDate
                ? new Date(formData.insuranceDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              setFormData({ ...formData, insuranceDate: e.target.value })
            }
            inputClasses="py-2"
          />
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={onClose}
            label="Cancel"
            className="hover:scale-105"
          />
          <CustomButton
            type="button"
            onClick={handleSubmit}
            label="Save Vehicle"
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};