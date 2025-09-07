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
                <svg
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}
                    className="fill-current text-white"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44771 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8Z" />
                </svg>
                Add New Order
            </button>
        </div>
    </div>
);
