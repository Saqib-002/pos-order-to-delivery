import { AnalyticsType } from "@/types/report";

export const DATE_RANGES = ["today", "week", "month", "custom"] as const;
export const STATUS_DISTRIBUTION = [
    { status: "Delivered", key: "totalDelivered", color: "bg-green-500" },
    { status: "In Kitchen", key: "totalSentToKitchen", color: "bg-orange-500" },
    { status: "Ready for Delivery", key: "totalReadyForDelivery", color: "bg-yellow-500" },
    { status: "Out for Delivery", key: "totalOutForDelivery", color: "bg-blue-500" },
    { status: "Cancelled", key: "totalCancelled", color: "bg-red-500" },
];
export const METRICS = [
    {
        title: "Total Orders",
        key: "totalOrders",
        icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
        color: "blue",
    },
    {
        title: "Delivered",
        key: "totalDelivered",
        icon: "M5 13l4 4L19 7",
        color: "green",
        subtext: (analytics: AnalyticsType) => `${analytics.successRate}% success rate`,
    },
    {
        title: "Avg Delivery Time",
        key: "avgDeliveryTime",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "orange",
        subtext: () => "minutes",
        format: (value: number) => value?value.toFixed(2):"0",
    },
    {
        title: "In Progress",
        key: "inProgress",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
        color: "purple",
        subtext: () => "kitchen + delivery",
    },
];