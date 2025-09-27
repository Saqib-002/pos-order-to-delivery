import React from "react";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";

interface AddressModalProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAddress: React.Dispatch<React.SetStateAction<string>>;
}

const AddressModal = ({ setIsOpen,setAddress }: AddressModalProps) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const addressString = Array.from(formData.entries()).map(([key, value]) => `${key}=${value}`).join("|");
        setAddress(addressString);
        setIsOpen(false);
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[51]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-indigo-500">
                        Add Address
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
                        type="text"
                        name="address"
                        label="Address"
                        placeholder="Address"
                        required
                        otherClasses="mb-4"
                    />

                    <CustomInput
                        type="text"
                        name="postal"
                        label="Postal Code"
                        placeholder="Postal Code"
                        required
                        otherClasses="mb-4"
                    />
                    <CustomInput
                        type="text"
                        name="city"
                        label="City"
                        placeholder="City"
                        required
                        otherClasses="mb-4"
                    />
                    <CustomInput
                        type="text"
                        name="province"
                        label="Province"
                        placeholder="Province"
                        required
                        otherClasses="mb-4"
                    />
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
    );
};

export default AddressModal;
