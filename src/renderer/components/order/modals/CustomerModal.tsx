import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import AddIcon from "../../../assets/icons/add.svg?react";
import { useState } from "react";
import AddressModal from "./AddressModal";
import { Tooltip } from "react-tooltip";

interface CustomerModalProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomerModal = ({ setIsOpen }: CustomerModalProps) => {
    const [address, setAddress] = useState("");
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here, e.g., add customer to order
        const formData = new FormData(e.target as HTMLFormElement);
        console.log(Object.fromEntries(formData.entries()));
        setIsOpen(false);
    };
    const formatAddress = (address: string) => {
        if (!address) return "";
        const parts = address.split("|");
        return (
            parts
                .map((item, index) => {
                    if (index === 1) return null;
                    const value = item.split("=")[1];
                    return value || "";
                })
                .filter(Boolean)
                .join(", ") +", " +(parts[1]?.split("=")[1] || "")
        );
    };
    return (
        <>
            {isAddressModalOpen && (
                <AddressModal
                    setIsOpen={setIsAddressModalOpen}
                    setAddress={setAddress}
                />
            )}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-indigo-500">
                            Add Customer
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <CustomInput
                            type="tel"
                            name="phone"
                            label="Phone"
                            placeholder="+1 (555) 123-4567"
                            required
                            otherClasses="mb-4"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <CustomInput
                                type="text"
                                name="name"
                                label="Name"
                                placeholder="John Doe"
                                required
                                otherClasses="mb-4 col-span-2"
                            />
                            <CustomInput
                                type="text"
                                name="cif"
                                label="CIF/DNI"
                                placeholder="12345678Z"
                                otherClasses="mb-4 col-span-1"
                            />
                        </div>
                        <CustomInput
                            type="email"
                            name="email"
                            label="Email"
                            placeholder="zOg2Q@example.com"
                            otherClasses="mb-4"
                        />
                        <div className="mb-4">
                            <label
                                htmlFor="comments"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Comments
                            </label>
                            <textarea
                                id="comments"
                                name="comments"
                                placeholder="comments"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="address"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Address
                            </label>
                            {address ? (
                                <>
                                    <Tooltip
                                        id="address-tooltip"
                                        place="bottom"
                                    />
                                    <p
                                        className="text-gray-800 whitespace-nowrap truncate max-w-full w-max"
                                        data-tooltip-id="address-tooltip"
                                        data-tooltip-content={formatAddress(
                                            address
                                        )}
                                    >
                                        {formatAddress(address)}
                                    </p>
                                </>
                            ) : (
                                <CustomButton
                                    Icon={<AddIcon className="text-lg" />}
                                    onClick={() => setIsAddressModalOpen(true)}
                                    type="button"
                                    label="Add Address"
                                    variant="transparent"
                                />
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <CustomButton
                                label="Cancel"
                                variant="secondary"
                                onClick={() => setIsOpen(false)}
                                type="button"
                            />
                            <CustomButton label="Add Customer" type="submit" />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CustomerModal;
