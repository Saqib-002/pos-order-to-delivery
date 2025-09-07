import AddIcon from "../../assets/icons/add.svg?react";
export const OrderHeader: React.FC<{
    onAddOrder: () => void;
}> = ({ onAddOrder }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Orders Management
                </h2>
                <p className="text-gray-600 mt-1">
                    Manage and track all restaurant orders
                </p>
            </div>
            <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer hover:scale-105"
                onClick={onAddOrder}
            >
                <AddIcon className="fill-current text-white size-6"/>
                Add New Order
            </button>
        </div>
    </div>
);
