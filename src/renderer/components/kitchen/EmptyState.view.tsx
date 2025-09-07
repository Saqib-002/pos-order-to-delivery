export const EmptyState: React.FC<{ hasKitchenOrders: boolean }> = ({
    hasKitchenOrders,
}) => (
    <div className="text-center py-12">
        <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
        </svg>
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
