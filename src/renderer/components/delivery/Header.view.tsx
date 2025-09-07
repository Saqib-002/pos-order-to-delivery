import DeliveredIcon from "../../assets/icons/delivered.svg?react";
export const Header: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Delivery Management
                </h2>
                <p className="text-gray-600 mt-1">
                    Assign and track order deliveries
                </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
                <DeliveredIcon className="size-8 text-blue-600"/>
            </div>
        </div>
    </div>
);
