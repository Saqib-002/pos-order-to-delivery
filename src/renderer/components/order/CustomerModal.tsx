import CustomInput from "../shared/CustomInput";

interface CustomerModalProps{
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomerModal = ({
    isOpen,
    setIsOpen,
}:CustomerModalProps) => {
    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here, e.g., add customer to order
        const formData = new FormData(e.target as HTMLFormElement);
        console.log(Object.fromEntries(formData.entries())); 
        setIsOpen(false);
    };
    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Add Customer
                            </h2>
                            <button
                                type="button"
                                onClick={()=>setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <CustomInput name="name" label="Name" required otherClasses="mb-4"/>
                            <CustomInput name="email" label="Email" required otherClasses="mb-4"/>
                            <CustomInput name="phone" label="Phone" required otherClasses="mb-4"/>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={()=>setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Add Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomerModal;
