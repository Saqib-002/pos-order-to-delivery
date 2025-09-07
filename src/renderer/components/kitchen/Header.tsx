import SentToKitchenIcon from "../../assets/icons/sent-to-kitchen.svg?react"
export const HeaderSection: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Kitchen Management
                </h2>
                <p className="text-gray-600 mt-1">
                    Monitor and manage orders in preparation
                </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
                <SentToKitchenIcon className="text-orange-600 size-8"/>
            </div>
        </div>
    </div>
);
