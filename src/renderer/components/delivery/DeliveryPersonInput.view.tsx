import { useMemo } from "react";

import SearchIcon from "../../assets/icons/search.svg?react";
import AddIcon from "../../assets/icons/add.svg?react";
import { DeliveryPerson } from "@/types/order";


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
        const filteredDeliveryPersons = useMemo(
            () =>
                deliveryPerson?.name.trim()
                    ? deliveryPersons.filter((person) =>
                        person.name
                            .toLowerCase()
                            .includes(deliveryPerson.name.toLowerCase())
                    )
                    : [],
            [deliveryPerson?.name, deliveryPersons]
        );

        const handleChange = (name: string) => {
            if (deliveryPerson) {
                setDeliveryPerson({ ...deliveryPerson, name });
            } else {
                setDeliveryPerson({
                    name,
                    phone: '',
                    email: '',
                    vehicleType: '',
                    licenseNo: '',
                });
            }
            setShowSuggestions(name.trim().length > 0);
        };

        const selectPerson = (person: DeliveryPerson) => {
            setDeliveryPerson(person);
            setShowSuggestions(false);
        };

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Delivery Person
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="size-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search delivery person by name..."
                                value={deliveryPerson?.name || ""}
                                onChange={(e) => handleChange(e.target.value)}
                                onFocus={() =>
                                    setShowSuggestions(
                                        !!deliveryPerson?.name?.trim()
                                    )
                                }
                                onBlur={() =>
                                    setTimeout(() => setShowSuggestions(false), 200)
                                }
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
                            />
                            {showSuggestions &&
                                filteredDeliveryPersons.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredDeliveryPersons.map((person) => (
                                            <button
                                                key={person.id}
                                                type="button"
                                                onClick={() => selectPerson(person)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {person.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {person.phone} •{" "}
                                                            {person.vehicleType}
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                            {person.licenseNo}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                        </div>
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
