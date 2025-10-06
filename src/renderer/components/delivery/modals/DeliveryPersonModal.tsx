import React from "react";
import { CustomSelect } from "../../ui/CustomSelect";
import { DeliveryPerson } from "@/types/delivery";

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
  const getVehicleTypeOptions = () => [
    { value: "bike", label: "Bike" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "car", label: "Car" },
    { value: "scooter", label: "Scooter" },
  ];

  if (!isOpen || !deliveryPerson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {isEditing ? "Edit Delivery Person" : "Add New Delivery Person"}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={deliveryPerson.name}
                onChange={(e) =>
                  setDeliveryPerson({
                    ...deliveryPerson,
                    name: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="text"
                value={deliveryPerson.email || ""}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-all duration-200 ${
                  emailError
                    ? "border-red-300 focus:ring-red-600 focus:border-red-600"
                    : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"
                }`}
                placeholder="Enter email address"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={(deliveryPerson as any).phone || ""}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-all duration-200 ${
                  phoneError
                    ? "border-red-300 focus:ring-red-600 focus:border-red-600"
                    : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"
                }`}
                placeholder="Enter phone number"
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                value={(deliveryPerson as any).licenseNo || ""}
                onChange={(e) =>
                  setDeliveryPerson({
                    ...deliveryPerson,
                    licenseNo: e.target.value,
                  } as any)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                placeholder="Enter license number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type
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
                placeholder="Select vehicle type"
                portalClassName="delivery-person-vehicle-type-dropdown-portal"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
            >
              {isEditing ? "Update Delivery Person" : "Add Delivery Person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
