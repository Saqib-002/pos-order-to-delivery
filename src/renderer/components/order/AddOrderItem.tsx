import { Item } from "@/types/order";
import React, { useState } from "react";
const AddOrderItem = ({
    items,
    setItems,
}: {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}) => {
    const [newItem, setNewItem] = useState({ name: "", quantity: 0 });
    const handleAddItem = () => {
        if (newItem.name.trim() !== "" && newItem.quantity > 0) {
            setItems([...items, newItem]);
            setNewItem({ name: "", quantity: 0 });
        }
    };
    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };
    return (
        <div className="my-6">
            <h3 className="text-lg mb-2 font-semibold">Items</h3>
            <div className="flex flex-col gap-2 mb-4">
                {items.map((item, index) => (
                    <div className="flex justify-between bg-slate-100 items-centerbg-slate-100 px-4 py-2 rounded" key={index}>
                        <span>
                            {item.quantity} x {item.name}
                        </span>
                        <button type="button" className="group cursor-pointer" onClick={() => removeItem(index)}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 30 30"
                                width="24px"
                                height="24px"
                                className="fill-current text-red-500 group-hover:text-red-600 transition-colors duration-150"
                            >
                                <path d="M 14.984375 2.4863281 A 1.0001 1.0001 0 0 0 14 3.5 L 14 4 L 8.5 4 A 1.0001 1.0001 0 0 0 7.4863281 5 L 6 5 A 1.0001 1.0001 0 1 0 6 7 L 24 7 A 1.0001 1.0001 0 1 0 24 5 L 22.513672 5 A 1.0001 1.0001 0 0 0 21.5 4 L 16 4 L 16 3.5 A 1.0001 1.0001 0 0 0 14.984375 2.4863281 z M 6 9 L 7.7929688 24.234375 C 7.9109687 25.241375 8.7633438 26 9.7773438 26 L 20.222656 26 C 21.236656 26 22.088031 25.241375 22.207031 24.234375 L 24 9 L 6 9 z" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-8 items-center">
                <div className="flex flex-col w-full">
                    <label htmlFor="item_name" className="text-slate-700">
                        Item
                    </label>
                    <input
                        type="text"
                        placeholder="Burger"
                        id="item_name"
                        value={newItem.name}
                        onChange={(e) =>
                            setNewItem({
                                ...newItem,
                                name: e.target.value,
                            })
                        }
                        className="mb-2 p-2 border-b-2 border-slate-600 hover:border-indigo-300 outline-none focus:border-indigo-600"
                    />
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="item_quantity" className="text-slate-700">
                        Quantity
                    </label>
                    <input
                        type="number"
                        placeholder="1"
                        id="item_quantity"
                        value={newItem.quantity}
                        onChange={(e) =>
                            setNewItem({
                                ...newItem,
                                quantity: Number(e.target.value),
                            })
                        }
                        className="mb-2 p-2 border-b-2 border-slate-600 hover:border-indigo-300 outline-none focus:border-indigo-600"
                    />
                </div>
                <button
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded min-w-max block h-max cursor-pointer"
                    onClick={handleAddItem}
                    type="button"
                >
                    Add Item
                </button>
            </div>
        </div>
    );
};

export default AddOrderItem;
