export const DATE_RANGES = ["today", "week", "month", "custom"] as const;
export const STATUS_DISTRIBUTION = [
  {
    status: "reports.statuses.delivered",
    key: "totalDelivered",
    color: "bg-green-500",
  },
  {
    status: "reports.statuses.sentToKitchen",
    key: "totalSentToKitchen",
    color: "bg-orange-500",
  },
  {
    status: "reports.statuses.readyForDelivery",
    key: "totalReadyForDelivery",
    color: "bg-yellow-500",
  },
  {
    status: "reports.statuses.outForDelivery",
    key: "totalOutForDelivery",
    color: "bg-blue-500",
  },
  {
    status: "reports.statuses.cancelled",
    key: "totalCancelled",
    color: "bg-red-500",
  },
];
