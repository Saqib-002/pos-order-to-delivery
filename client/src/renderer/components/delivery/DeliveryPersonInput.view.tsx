import { useMemo } from "react";

import AddIcon from "../../assets/icons/add.svg?react";
import { DeliveryPerson } from "@/types/order";
import { CustomSelect } from "../ui/CustomSelect";

export const DeliveryPersonInput: React.FC<{
  deliveryPerson: DeliveryPerson | null;
  setDeliveryPerson: React.Dispatch<
    React.SetStateAction<DeliveryPerson | null>
  >;
  deliveryPersons: DeliveryPerson[];
  showSuggestions: boolean;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  onAssign: () => void;
  disabled: boolean;
}> = ({
  deliveryPerson,
  setDeliveryPerson,
  deliveryPersons,
  showSuggestions,
  setShowSuggestions,
  onAssign,
  disabled,
}) => {
  const deliveryPersonOptions = useMemo(
    () =>
      deliveryPersons.map((person) => ({
        value: person.id || person.name,
        label: `${person.name} (${person.vehicleType})`,
        person: person,
      })),
    [deliveryPersons]
  );

  const handleSelectChange = (value: string) => {
    const selectedOption = deliveryPersonOptions.find(
      (option) => option.value === value
    );
    if (selectedOption) {
      setDeliveryPerson(selectedOption.person);
    } else {
      setDeliveryPerson(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Delivery Person
          </label>
          <CustomSelect
            options={deliveryPersonOptions}
            value={deliveryPerson?.id || deliveryPerson?.name || ""}
            onChange={handleSelectChange}
            placeholder="Choose a delivery person..."
            portalClassName="delivery-person-select-portal"
          />
        </div>
        <button
          onClick={onAssign}
          disabled={disabled}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <AddIcon className="size-5" />
          Quick Assign
        </button>
      </div>
    </div>
  );
};
