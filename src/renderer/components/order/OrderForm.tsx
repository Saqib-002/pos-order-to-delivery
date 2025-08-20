import { useState } from "react";
import { Item, Order } from "@/types/order";
import { toast } from "react-toastify";
import AddOrderItem from "./AddOrderItem";

export const OrderForm: React.FC = () => {
    const [customer, setCustomer] = useState({
        name: "",
        phone: "",
        address: "",
    });
    const [currentOrderedItems, setCurrentOrderedItems] = useState<Item[]>([]);

    const handleSubmit = async () => {
        const order: Order = {
            _id: new Date().toISOString(),
            customer,
            items: currentOrderedItems,
            status: "Sent to Kitchen",
            createdAt: new Date().toISOString(),
        };
        await (window as any).electronAPI.saveOrder(order);
        setCustomer({ name: "", phone: "", address: "" });
        setCurrentOrderedItems([]);
        toast.success("Order saved!");
    };

    const sendToKitchen = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await handleSubmit();
    };
    
    return (
            <form
                onSubmit={(e) => sendToKitchen(e)}
                className="bg-white p-6 rounded shadow"
            >
                <div>
                    <h3 className="text-lg mb-2 font-semibold">
                        Contact Information
                    </h3>
                    <div className="flex gap-8">
                        <div className="flex flex-col w-full">
                            <label htmlFor="name" className="text-slate-700">
                                Name
                            </label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                id="name"
                                value={customer.name}
                                onChange={(e) =>
                                    setCustomer({
                                        ...customer,
                                        name: e.target.value,
                                    })
                                }
                                className="mb-2 p-2 border-b-2 border-slate-600 hover:border-indigo-300 outline-none focus:border-indigo-600"
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <label htmlFor="phone" className="text-slate-700">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="John Doe"
                                id="phone"
                                value={customer.phone}
                                onChange={(e) =>
                                    setCustomer({
                                        ...customer,
                                        phone: e.target.value,
                                    })
                                }
                                className="mb-2 p-2 border-b-2 border-slate-600 hover:border-indigo-300 outline-none focus:border-indigo-600"
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <label htmlFor="address" className="text-slate-700">
                                Address
                            </label>
                            <input
                                type="text"
                                placeholder="123 Main St. Anytown"
                                id="address"
                                value={customer.address}
                                onChange={(e) =>
                                    setCustomer({
                                        ...customer,
                                        address: e.target.value,
                                    })
                                }
                                className="mb-2 p-2 border-b-2 border-slate-600 hover:border-indigo-300 outline-none focus:border-indigo-600"
                            />
                        </div>
                    </div>
                    <AddOrderItem items={currentOrderedItems} setItems={setCurrentOrderedItems} />
                </div>
                <button
                    type="submit"
                    className="p-2 bg-green-500 cursor-pointer hover:bg-green-600 w-full font-semibold transition-colors duration-150 text-white rounded"
                >
                    Send to Kitchen
                </button>
            </form>
    );
};
