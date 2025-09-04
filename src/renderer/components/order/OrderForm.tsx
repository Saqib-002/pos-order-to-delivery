import { useEffect, useState } from "react";
import { Item, Order } from "@/types/order";
import { toast } from "react-toastify";
import AddOrderItem from "./AddOrderItem";

interface OrderFormProps {
    onClose: () => void;
    selectedOrder: Order | null;
    token: string | null;
}

export const OrderForm: React.FC<OrderFormProps> = ({
    onClose,
    selectedOrder,
    token
}) => {
    const [customer, setCustomer] = useState({
        name: "",
        phone: "",
        address: "",
    });
    const [currentOrderedItems, setCurrentOrderedItems] = useState<Item[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (selectedOrder) {
            setCustomer(selectedOrder.customer);
            setCurrentOrderedItems(selectedOrder.items);
        }
    }, []);
    const handleSubmit = async () => {
        if (
            !customer.name.trim() ||
            !customer.phone.trim() ||
            !customer.address.trim()
        ) {
            toast.error("Please fill in all customer information");
            return;
        }

        if (currentOrderedItems.length === 0) {
            toast.error("Please add at least one item to the order");
            return;
        }

        setIsSubmitting(true);
        if (selectedOrder) {
            try {
                const updatedOrder = {
                    ...selectedOrder,
                    customer,
                    items: currentOrderedItems,
                };
                await (window as any).electronAPI.updateOrder(token,updatedOrder);
                onClose();
            } catch (error) {
                toast.error("Failed to update order. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }
        try {
            const order: Order = {
                id: `orders:${new Date().toISOString()}`,
                customer,
                items: currentOrderedItems,
                status: "Sent to Kitchen",
                createdAt: new Date().toISOString(),
            };
            await (window as any).electronAPI.saveOrder(token,order);
            setCustomer({ name: "", phone: "", address: "" });
            setCurrentOrderedItems([]);
            onClose();
        } catch (error) {
            toast.error("Failed to save order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sendToKitchen = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await handleSubmit();
    };

    const totalItems = currentOrderedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {selectedOrder ? "Edit" : "Add New"} Order
                            </h2>
                            <p className="text-indigo-100 mt-1">
                                {selectedOrder ? "Edit" : "Add"} customer
                                details and order items
                            </p>
                        </div>
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

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <form onSubmit={sendToKitchen} className="space-y-8">
                        {/* Customer Information Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                    <svg
                                        className="w-5 h-5 text-indigo-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Customer Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        id="name"
                                        required
                                        value={customer.name}
                                        onChange={(e) =>
                                            setCustomer({
                                                ...customer,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        id="phone"
                                        required
                                        value={customer.phone}
                                        onChange={(e) =>
                                            setCustomer({
                                                ...customer,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="address"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Delivery Address *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="123 Main St, Anytown, ST 12345"
                                        id="address"
                                        required
                                        value={customer.address}
                                        onChange={(e) =>
                                            setCustomer({
                                                ...customer,
                                                address: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Order Items Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                                        <svg
                                            className="w-5 h-5 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Order Items
                                    </h3>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {totalItems} item
                                    {totalItems !== 1 ? "s" : ""}
                                </div>
                            </div>

                            <AddOrderItem
                                items={currentOrderedItems}
                                setItems={setCurrentOrderedItems}
                            />

                            {currentOrderedItems.length > 0 && (
                                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-3">
                                        Order Summary
                                    </h4>
                                    <div className="space-y-2">
                                        {currentOrderedItems.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <span className="text-gray-700">
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-gray-500">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                        <div className="pt-2 border-t border-gray-200">
                                            <div className="flex justify-between items-center font-semibold text-lg">
                                                <span>Total Items</span>
                                                <span className="text-indigo-600">
                                                    {totalItems}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting || currentOrderedItems.length === 0
                            }
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer hover:scale-105"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                    {selectedOrder
                                        ? "Update Order"
                                        : "Send to kitchen"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
