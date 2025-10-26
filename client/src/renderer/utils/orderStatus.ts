import i18n from "../../i18n";

export const translateOrderStatus = (status: string): string => {
  if (!status) return "";

  const statusKey = status.toLowerCase().replace(/\s+/g, "");

  switch (statusKey) {
    case "pending":
      return i18n.t("orderStatuses.pending");
    case "senttokitchen":
      return i18n.t("orderStatuses.sentToKitchen");
    case "readyfordelivery":
      return i18n.t("orderStatuses.readyForDelivery");
    case "outfordelivery":
      return i18n.t("orderStatuses.outForDelivery");
    case "completed":
      return i18n.t("orderStatuses.completed");
    case "delivered":
      return i18n.t("orderStatuses.delivered");
    case "cancelled":
      return i18n.t("orderStatuses.cancelled");
    default:
      // Return the original status if no translation found
      return status;
  }
};

export const getOrderStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "sent to kitchen":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "ready for delivery":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "out for delivery":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
