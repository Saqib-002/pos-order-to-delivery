import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useConfigurations } from "../contexts/configurationContext";
import { toast } from "react-toastify";
import Header from "../components/shared/Header.order";
import CustomButton from "../components/ui/CustomButton";
import { OrderTable } from "../components/shared/OrderTable";
import PlatformOrderModal from "../components/order/modals/PlatformOrderModal";
import { Order, FilterType } from "@/types/order";
import { calculateOrderTotal } from "../utils/orderCalculations";
import { calculatePaymentStatus } from "../utils/paymentStatus";
import {
  translateOrderStatus,
  getOrderStatusStyle,
  translatePaymentStatus,
  getPaymentStatusStyle,
} from "../utils/orderStatus";
import {
  EyeIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AddIcon,
  EditIcon,
  CrossIcon,
} from "@/renderer/public/Svg";
import OrderDetailsModal from "../components/order/modals/OrderDetailsModal";
import { CancelOrderModal } from "../components/order/modals/CancelOrderModal";
import { DEFAULT_PAGE_LIMIT } from "@/constants";
import Pagination from "../components/shared/Pagination";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import { DateRangePicker } from "../components/ui/DateRangePicker";

const PlatformOrdersView = () => {
  const { t, i18n } = useTranslation();
  const {
    auth: { token },
  } = useAuth();
  const { configurations } = useConfigurations();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [filter, setFilter] = useState<FilterType>({
    searchTerm: "",
    selectedDate: new Date(),
    selectedStatus: [],
    selectedPaymentStatus: [],
    page: 0,
    limit: DEFAULT_PAGE_LIMIT,
    startDateRange: null,
    endDateRange: null,
    selectedDeliveryPerson: "",
    selectedCustomer: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [platforms, setPlatforms] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchPlatformOrders();
    fetchPlatforms();
  }, [filter, token]);

  useEffect(() => {
    if (!filter.selectedDate) {
      setFilter((prev) => ({
        ...prev,
        selectedDate: new Date(),
        page: 0,
      }));
    }
  }, [filter.selectedDate]);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [orders]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const fetchPlatforms = async () => {
    if (!token) return;
    try {
      const res = await (window as any).electronAPI.getAllPlatforms(token);
      if (res.status) {
        setPlatforms(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    }
  };

  const fetchPlatformOrders = async () => {
    if (!token) return;
    try {
      const platformFilter = {
        ...filter,
        orderType: "platform",
      };
      const res = await (window as any).electronAPI.getOrdersByFilter(
        token,
        platformFilter
      );
      if (res.status) {
        setOrders(res.data.orders || []);
        setTotalOrders(res.data.totalCount || 0);
      } else {
        toast.error("Error fetching platform orders");
      }
    } catch (error) {
      toast.error("Error fetching platform orders");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const handleCancelOrderClick = (order: Order) => {
    setSelectedOrderForCancel(order);
    setIsCancelOrderModalOpen(true);
  };

  const handleCancelOrderConfirm = async (cancelNote: string) => {
    if (!selectedOrderForCancel) return;

    try {
      const res = await (window as any).electronAPI.deleteOrder(
        token,
        selectedOrderForCancel.id,
        cancelNote
      );
      if (!res.status) {
        toast.error(
          res.error ||
            t("platformOrders.errors.failedToCancelOrder") ||
            "Failed to cancel order"
        );
        return;
      }
      toast.success(
        t("platformOrders.messages.orderCancelled") ||
          "Order cancelled successfully"
      );
      setIsCancelOrderModalOpen(false);
      setSelectedOrderForCancel(null);
      fetchPlatformOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(
        t("platformOrders.errors.failedToCancelOrder") ||
          "Failed to cancel order"
      );
    }
  };

  const getPlatformName = (platformId: string | undefined) => {
    if (!platformId) return "-";
    const platform = platforms.find((p) => p.id === platformId);
    return platform?.name || "-";
  };

  const clearFilters = () => {
    setFilter({
      searchTerm: "",
      selectedDate: new Date(),
      selectedStatus: [],
      selectedPaymentStatus: [],
      page: 0,
      limit: DEFAULT_PAGE_LIMIT,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
      selectedCustomer: "",
    });
  };

  const paymentStatuses = ["PARTIAL", "UNPAID", "PAID"];
  const orderStatuses = [
    "pending",
    "completed",
    "sent to kitchen",
    "ready for delivery",
    "out for delivery",
    "delivered",
    "cancelled",
  ];

  const orderStatusOptions = [
    { value: "", label: t("platformOrders.filters.allStatuses") },
    ...orderStatuses.map((status) => ({
      value: status,
      label: translateOrderStatus(status),
    })),
  ];

  const paymentStatusOptions = [
    { value: "", label: t("platformOrders.filters.allPaymentStatuses") },
    ...paymentStatuses.map((status) => ({
      value: status,
      label: translatePaymentStatus(status),
    })),
  ];

  const renderOrderRow = (order: Order) => {
    const orderAny = order as any;
    const { orderTotal } = calculateOrderTotal(order.items || []);
    const paymentStatus = calculatePaymentStatus(
      order.paymentType || "",
      orderTotal
    );
    return (
      <tr key={order.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          #{order.orderId}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {getPlatformName(orderAny.platformId || (order as any).platformId)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {(order.customer as any)?.name || orderAny.customerName || "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {(order.customer as any)?.phone || orderAny.customerPhone || "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          €{orderTotal.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusStyle(paymentStatus.status)}`}
          >
            {translatePaymentStatus(paymentStatus.status)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusStyle(order.status || "")}`}
          >
            {translateOrderStatus(order.status || "")}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {orderAny.receivingTime || (order as any).receivingTime
            ? new Date(
                orderAny.receivingTime || (order as any).receivingTime
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(order.createdAt || "").toLocaleDateString()}
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt || "").toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleViewOrder(order)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer"
              title={t("platformOrders.actions.viewOrder")}
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            {order.status?.toLowerCase() !== "completed" &&
              order.status?.toLowerCase() !== "cancelled" && (
                <>
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    title={t("platformOrders.actions.editOrder")}
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCancelOrderClick(order)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    title={t("platformOrders.actions.cancelOrder")}
                  >
                    <CrossIcon className="w-5 h-5" />
                  </button>
                </>
              )}
          </div>
        </td>
      </tr>
    );
  };

  const columns = [
    t("platformOrders.table.orderNumber"),
    t("platformOrders.table.platform"),
    t("platformOrders.table.customerName"),
    t("platformOrders.table.customerPhone"),
    t("platformOrders.table.price"),
    t("platformOrders.table.paymentStatus"),
    t("platformOrders.table.status"),
    t("platformOrders.table.receivingTime"),
    t("platformOrders.table.created"),
    t("platformOrders.table.actions"),
  ];

  const totalPages =
    totalOrders > 0
      ? Math.ceil(totalOrders / (filter.limit || DEFAULT_PAGE_LIMIT))
      : 0;

  const handlePageChange = (newPage: number) => {
    setFilter((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="p-6">
      <Header
        title={t("platformOrders.title")}
        subtitle={t("platformOrders.subtitle")}
        icon={<img src="/images/platform.png" width={48} height={48} />}
        iconbgClasses="bg-red-100"
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-black">
              {t("platformOrders.title")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("platformOrders.tableDescription")}
            </p>
          </div>
          <CustomButton
            type="button"
            label={t("platformOrders.addOrder")}
            onClick={() => setIsModalOpen(true)}
            Icon={<AddIcon className="size-7" />}
          />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative">
        {/* Scroll Arrows */}
        <div className="absolute top-1 right-4 flex gap-2 z-10">
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canScrollLeft
                ? "bg-gray-300 hover:bg-gray-400 text-gray-700 cursor-pointer"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            title="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canScrollRight
                ? "bg-gray-300 hover:bg-gray-400 text-gray-700 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex flex-col lg:flex-row gap-4 items-end min-w-max">
            {/* Search Input */}
            <div className="w-full lg:w-80">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                <span>{t("platformOrders.searchOrders")}</span>
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <CustomInput
                  label=""
                  name="searchTerm"
                  type="text"
                  value={filter.searchTerm || ""}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                      page: 0,
                    }))
                  }
                  placeholder={t("platformOrders.searchPlaceholder")}
                  otherClasses="w-full"
                  inputClasses="pl-10 py-2.5"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("platformOrders.filterByDate")}
              </label>
              <DateRangePicker
                startDate={filter.startDateRange}
                endDate={filter.endDateRange}
                selectedDate={filter.selectedDate}
                onChange={(startDate, endDate) => {
                  setFilter((prev) => ({
                    ...prev,
                    startDateRange: startDate,
                    endDateRange: endDate,
                    selectedDate: startDate,
                    page: 0,
                  }));
                }}
                className="w-full"
              />
            </div>

            {/* Order Status Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("platformOrders.orderStatus")}
              </label>
              <CustomSelect
                options={orderStatusOptions}
                value={filter.selectedStatus[0] || ""}
                onChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    selectedStatus: value ? [value] : [],
                    page: 0,
                  }))
                }
                placeholder={t("platformOrders.filters.allStatuses")}
                className="w-full"
              />
            </div>

            {/* Payment Status Filter */}
            <div className={`w-full ${
                i18n.language === 'es' ? 'lg:w-54' : 'lg:w-48'
              }`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("platformOrders.paymentStatus")}
              </label>
              <CustomSelect
                options={paymentStatusOptions}
                value={filter.selectedPaymentStatus[0] || ""}
                onChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    selectedPaymentStatus: value ? [value] : [],
                    page: 0,
                  }))
                }
                placeholder={t("platformOrders.filters.allPaymentStatuses")}
                className="w-full"
              />
            </div>

            {/* Clear Filters Button */}
            {(filter.searchTerm ||
              filter.selectedStatus.length > 0 ||
              filter.selectedPaymentStatus.length > 0 ||
              filter.startDateRange ||
              filter.endDateRange) && (
              <div className="w-full lg:w-auto">
                <CustomButton
                  type="button"
                  label={t("platformOrders.clearFilters")}
                  onClick={clearFilters}
                  variant="transparent"
                  className="border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <OrderTable
          data={orders}
          columns={columns}
          renderRow={renderOrderRow}
          emptyStateTitle={t("platformOrders.noOrders")}
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={filter.page || 0}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Add Order Modal */}
      <PlatformOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchPlatformOrders();
        }}
      />

      {/* Edit Order Modal */}
      {editingOrder && (
        <PlatformOrderModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingOrder(null);
          }}
          onSuccess={() => {
            fetchPlatformOrders();
            setIsEditModalOpen(false);
            setEditingOrder(null);
          }}
          mode="edit"
          initialOrder={editingOrder}
        />
      )}

      {/* Cancel Order Modal */}
      {selectedOrderForCancel && (
        <CancelOrderModal
          isOpen={isCancelOrderModalOpen}
          onClose={() => {
            setIsCancelOrderModalOpen(false);
            setSelectedOrderForCancel(null);
          }}
          onConfirm={handleCancelOrderConfirm}
          order={selectedOrderForCancel}
          orderPrefix={configurations?.orderPrefix || "K"}
        />
      )}

      {/* Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
          view="platform"
          platforms={platforms}
        />
      )}
    </div>
  );
};

export default PlatformOrdersView;
