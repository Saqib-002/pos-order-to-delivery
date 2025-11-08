import { useEffect, useContext } from "react";
import { OrderContext } from "@/renderer/contexts/OrderContext";
import { FilterType } from "@/types/order";
import { ChevronLeftIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { CustomSelect } from "../ui/CustomSelect";
import { useOrderManagementContext } from "@/renderer/contexts/orderManagementContext";
import { useTranslation } from "react-i18next";
import { DEFAULT_PAGE_LIMIT } from "@/constants";

const OrderComponentHeader = () => {
  const { t } = useTranslation();
  const orderContext = useContext(OrderContext);
  const { refreshOrdersCallback, filter, setFilter } =
    useOrderManagementContext();

  if (!orderContext) {
    return (
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="text-center text-gray-500">{t("common.loading")}</div>
      </div>
    );
  }

  const { clearOrder, orderItems } = orderContext;

  useEffect(() => {
    const now = new Date();
    const localMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      5,
      0,
      0
    );
    setFilter({
      searchTerm: "",
      selectedDate: localMidnight,
      selectedStatus: [],
      selectedPaymentStatus: [],
      page: 0,
      limit: DEFAULT_PAGE_LIMIT,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
      selectedCustomer: "",
    });
  }, []);
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = event.target.value
      ? new Date(event.target.value)
      : null;
    setFilter((prev: FilterType) => ({
      ...prev,
      selectedDate,
      page: 0,
    }));
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleCombinedFilterChange = (value: string) => {
    if (value === "all") {
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [],
        selectedPaymentStatus: [],
        page: 0,
      }));
    } else if (value.startsWith("status:")) {
      const status = value.replace("status:", "");
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [status],
        selectedPaymentStatus: [],
        page: 0,
      }));
    } else if (value.startsWith("payment:")) {
      const paymentStatus = value.replace("payment:", "");
      setFilter((prev) => ({
        ...prev,
        selectedStatus: [],
        selectedPaymentStatus: [paymentStatus],
        page: 0,
      }));
    }
  };

  const combinedFilterOptions = [
    { value: "all", label: t("orderManagement.filters.allOrders") },
    { value: "status:pending", label: t("orderManagement.filters.pending") },
    {
      value: "status:sent to kitchen",
      label: t("orderManagement.filters.sentToKitchen"),
    },
    {
      value: "status:ready for delivery",
      label: t("orderManagement.filters.readyForDelivery"),
    },
    {
      value: "status:out for delivery",
      label: t("orderManagement.filters.outForDelivery"),
    },
    {
      value: "status:completed",
      label: t("orderManagement.filters.completed"),
    },
    {
      value: "status:delivered",
      label: t("orderManagement.filters.delivered"),
    },
    {
      value: "status:cancelled",
      label: t("orderManagement.filters.cancelled"),
    },
    { value: "payment:PAID", label: t("orderManagement.filters.paid") },
    { value: "payment:UNPAID", label: t("orderManagement.filters.unpaid") },
    {
      value: "payment:PARTIAL",
      label: t("orderManagement.filters.partialPayment"),
    },
  ];

  const getCurrentFilterValue = () => {
    if (
      filter.selectedStatus.length > 0 &&
      filter.selectedStatus[0] !== "all"
    ) {
      return `status:${filter.selectedStatus[0]}`;
    }
    if (
      filter.selectedPaymentStatus.length > 0 &&
      filter.selectedPaymentStatus[0] !== "all"
    ) {
      return `payment:${filter.selectedPaymentStatus[0]}`;
    }
    return "all";
  };

  return (
    <>
      {!(orderItems.length > 0) && (
        <div className="row-span-1">
          <div className="flex justify-between items-center p-2 gap-2">
            <>
              <input
                id="date-filter"
                type="date"
                value={formatDateForInput(filter.selectedDate)}
                onChange={handleDateChange}
                className="px-3 py-3 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors flex-1"
              />
              <CustomSelect
                options={combinedFilterOptions}
                value={getCurrentFilterValue()}
                onChange={handleCombinedFilterChange}
                placeholder={t("orderManagement.filters.filterOrders")}
                className="text-sm flex-1"
              />
            </>
          </div>
          <div className="h-[1px] bg-gray-400"></div>
        </div>
      )}
    </>
  );
};

export default OrderComponentHeader;
