export const DATE_RANGES = ["today", "week", "month", "custom"] as const;
export const STATUS_DISTRIBUTION = [
    { status: "Delivered", key: "totalDelivered", color: "bg-green-500" },
    { status: "In Kitchen", key: "totalSentToKitchen", color: "bg-orange-500" },
    { status: "Ready for Delivery", key: "totalReadyForDelivery", color: "bg-yellow-500" },
    { status: "Out for Delivery", key: "totalOutForDelivery", color: "bg-blue-500" },
    { status: "Cancelled", key: "totalCancelled", color: "bg-red-500" },
];