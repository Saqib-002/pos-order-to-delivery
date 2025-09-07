import TotalOrdersIcon from "../../assets/icons/total-orders.svg?react"
export const EmptyState: React.FC<{ hasKitchenOrders: boolean }> = ({
    hasKitchenOrders,
}) => (
    <div className="text-center py-12">
        <TotalOrdersIcon className="mx-auto size-12 text-gray-400"/>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
            {hasKitchenOrders
                ? "No orders match your search"
                : "No orders in kitchen"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
            {hasKitchenOrders
                ? "Try adjusting your search criteria or date filter."
                : "All orders are ready or completed."}
        </p>
    </div>
);
