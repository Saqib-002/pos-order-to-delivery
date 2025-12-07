import { useState, useMemo, useEffect, useRef } from "react";
import { Order, Customer } from "@/types/order";
import { DeliveryPerson } from "@/types/delivery";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import { calculateOrderTotal } from "../utils/orderCalculations";
import { calculatePaymentStatus } from "../utils/paymentStatus";
import { generateReceiptHTML, groupItemsByPrinter } from "../utils/printer";
import {
  translateOrderStatus,
  getOrderStatusStyle,
  translatePaymentStatus,
  getPaymentStatusStyle,
  translateOrderType,
  getOrderTypeStyle,
} from "../utils/orderStatus";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import OrderDetailsModal from "../components/order/modals/OrderDetailsModal";
import BulkPaymentModal from "../components/order/modals/BulkPaymentModal";
import IndividualPaymentModal from "../components/order/modals/IndividualPaymentModal";
import { CancelOrderModal } from "../components/order/modals/CancelOrderModal";
import { toast } from "react-toastify";
import {
  DeliveredIcon,
  DocumentIcon,
  Euro,
  EyeIcon,
  LightningBoltIcon,
  PersonIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
} from "@/renderer/public/Svg";
import { useOrderManagementContext } from "../contexts/orderManagementContext";
import { useConfigurations } from "../contexts/configurationContext";
import { DEFAULT_PAGE_LIMIT, FUNCTIONS } from "@/constants";
import Pagination from "../components/shared/Pagination";
import { formatAddress } from "../utils/utils";

export const ManageOrdersView = () => {
  const { t } = useTranslation();
  const {
    auth: { token, user },
  } = useAuth();
  const { orders, filter, setFilter, totalOrders, refreshOrdersCallback } =
    useOrderManagementContext();
  const { configurations } = useConfigurations();
  useEffect(() => {
    if (!filter.selectedDate) {
      setFilter((prev) => ({
        ...prev,
        selectedDate: new Date(),
        page: 0,
      }));
    }
  }, [filter.selectedDate, setFilter]);

  // Fetch delivery persons on component mount
  useEffect(() => {
    fetchDeliveryPersons();
    fetchCustomers();
    fetchPlatforms();
  }, []);
  useEffect(() => {
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
  }, []);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] =
    useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loadingDeliveryPersons, setLoadingDeliveryPersons] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [platforms, setPlatforms] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchDeliveryPersons = async () => {
    try {
      setLoadingDeliveryPersons(true);
      const res = await (window as any).electronAPI.getDeliveryPersons(token);
      if (!res.status) {
        toast.error(t("deliveryManagement.errors.fetchFailed"));
        return;
      }
      setDeliveryPersons(res.data);
    } catch (error) {
      console.error("Error fetching delivery persons:", error);
      toast.error(t("deliveryManagement.errors.fetchFailed"));
    } finally {
      setLoadingDeliveryPersons(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await (window as any).electronAPI.getAllCustomers(token);
      if (!res.status) {
        toast.error(t("deliveryManagement.errors.fetchFailed"));
        return;
      }
      setCustomers(res.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(t("deliveryManagement.errors.fetchFailed"));
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await (window as any).electronAPI.getAllPlatforms(token);
      if (res.status) {
        setPlatforms(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    }
  };

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

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
  }, [orders, customers, deliveryPersons]);

  const paymentStatuses = ["PARTIAL", "UNPAID", "PAID"];

  const clearFilters = () => {
    setFilter({
      searchTerm: "",
      selectedDate: new Date(),
      selectedStatus: ["all"],
      selectedPaymentStatus: [],
      page: 0,
      limit: DEFAULT_PAGE_LIMIT,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
      selectedCustomer: "",
    });
  };

  const handlePaymentClick = (order: Order) => {
    setSelectedOrderForPayment(order);
    setIsPaymentModalOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      const printerGroups = groupItemsByPrinter(order.items || []);
      if (!Object.keys(printerGroups).length) {
        toast.warn(t("orderCart.warnings.noPrintersAttached"));
        return;
      }

      let configs = {
        name: t("orderCart.pointOfSale"),
        address: t("orderCart.defaultAddress"),
        logo: "",
        id: "",
        orderPrefix: configurations.orderPrefix || "K",
      };
      const configRes = await (window as any).electronAPI.getConfigurations(
        token
      );
      if (!configRes.status) {
        toast.error(t("orderCart.errors.errorGettingConfigurations"));
        return;
      }
      if (configRes.data) {
        configs = { ...configs, ...configRes.data };
      }

      const { orderTotal } = calculateOrderTotal(order.items || []);
      const { status } = calculatePaymentStatus(
        order.paymentType || "",
        orderTotal
      );

      toast.info(t("orderCart.messages.printingCustomerReceipt"));

      for (const [printer, items] of Object.entries(printerGroups)) {
        const printerName = printer.split("|")[0];
        const printerIsMain = printer.split("|")[1];

        if (printerIsMain === "true") {
          // Get customer address only for delivery orders
          let customerAddress: string | undefined = undefined;
          if (order.orderType === "delivery") {
            if (order?.customer?.address && order.customer.address.trim()) {
              customerAddress = order.customer.address.includes("|")
                ? formatAddress(order.customer.address)
                : order.customer.address;
            }
          }

          // Get pickup time and format it
          let formattedPickupTime: string | undefined = undefined;
          if (order.orderType === "pickup" && order.pickupTime) {
            try {
              const pickupDate = new Date(order.pickupTime);
              if (!isNaN(pickupDate.getTime())) {
                formattedPickupTime = pickupDate.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else {
                formattedPickupTime = order.pickupTime;
              }
            } catch (e) {
              formattedPickupTime = order.pickupTime;
            }
          }

          const customerPhone = order?.customer?.phone;
          const customerName = order?.customer?.name;

          const receiptHTML = generateReceiptHTML(
            items,
            configs,
            order.orderId,
            order.orderType,
            user?.role || "",
            status,
            t,
            customerAddress,
            formattedPickupTime,
            customerPhone,
            customerName,
            user?.name
          );

          if (!receiptHTML) {
            continue;
          }

          const printRes = await (window as any).electronAPI.printToPrinter(
            token,
            printerName,
            { html: receiptHTML }
          );

          if (!printRes.status) {
            if (printRes.error === t("orderCart.errors.printerNotFoundError")) {
              toast.error(
                t("orderCart.errors.printerNotFound", { printerName })
              );
            } else {
              toast.error(t("orderCart.errors.errorPrintingReceipt"));
            }
            return;
          }
        }
      }

      toast.success(t("orderCart.messages.receiptPrintedSuccessfully"));
    } catch (error) {
      console.error("Failed to print order:", error);
      toast.error(t("orderCart.errors.errorPrintingReceipt"));
    }
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
            t("manageOrders.errors.cancelFailed") ||
            "Failed to cancel order"
        );
        return;
      }
      toast.success(
        t("manageOrders.messages.orderCancelled") ||
          "Order cancelled successfully"
      );
      setIsCancelOrderModalOpen(false);
      setSelectedOrderForCancel(null);
      refreshOrdersCallback();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(
        t("manageOrders.errors.cancelFailed") || "Failed to cancel order"
      );
    }
  };

  const hasCancelOrderPermission = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.functionPermissions?.includes(FUNCTIONS.CANCEL_ORDER) || false;
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
  };

  // Bulk payment handler
  const handleBulkPaymentClick = () => {
    setIsBulkPaymentModalOpen(true);
  };

  // Table columns
  const columns = [
    t("manageOrders.table.orderNumber"),
    t("manageOrders.table.customer"),
    t("manageOrders.table.orderType"),
    t("manageOrders.table.status"),
    t("manageOrders.table.paymentStatus"),
    t("manageOrders.table.deliveryPerson"),
    t("manageOrders.table.total"),
    t("manageOrders.table.created"),
    t("manageOrders.table.actions"),
  ];

  // Render order row
  const renderOrderRow = (order: Order) => {
    const { orderTotal } = calculateOrderTotal(order.items || []);
    const paymentStatus = calculatePaymentStatus(
      order.paymentType || "",
      orderTotal
    );

    return (
      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-black">
          {configurations.orderPrefix || "K"}
          {order.orderId}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {order.customer.name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getOrderTypeStyle(order.orderType || "")}`}
          >
            {translateOrderType(order.orderType || "") ||
              t("manageOrders.statuses.nA")}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusStyle(order.status || "")}`}
          >
            {translateOrderStatus(order.status || "")}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusStyle(paymentStatus.status)}`}
            >
              {translatePaymentStatus(paymentStatus.status)}
            </span>
            {paymentStatus.status === "PARTIAL" && (
              <span className="text-xs text-yellow-700">
                €{paymentStatus.totalPaid.toFixed(2)} / €{orderTotal.toFixed(2)}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {order.deliveryPerson ? (
            <div>
              <div className="font-medium">{order.deliveryPerson.name}</div>
              <div className="text-gray-500 text-xs">
                {order.deliveryPerson.phone}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">
              {t("manageOrders.statuses.notAssigned")}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          €{calculateOrderTotal(order.items || []).orderTotal.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(order.createdAt || "").toLocaleDateString()}
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt || "").toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            {/* View Order Button */}
            <button
              onClick={() => handleViewOrder(order)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer"
              title={t("manageOrders.actions.viewOrder")}
            >
              <EyeIcon className="w-5 h-5" />
            </button>

            {/* Print Order Button */}
            <button
              onClick={() => handlePrintOrder(order)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 cursor-pointer"
              title={t("manageOrders.actions.printOrder")}
            >
              <DocumentIcon className="w-5 h-5" />
            </button>

            {/* Process Payment Button - Only show for UNPAID or PARTIAL orders with remaining amount > 0 */}
            {(() => {
              const { orderTotal } = calculateOrderTotal(order.items || []);
              const paymentStatus = calculatePaymentStatus(
                order.paymentType || "",
                orderTotal
              );

              const isPaymentAllowed =
                order.status === "complete" || order.status === "delivered";
              const hasUnpaidAmount =
                (paymentStatus.status === "UNPAID" ||
                  paymentStatus.status === "PARTIAL") &&
                paymentStatus.remainingAmount > 0;

              if (isPaymentAllowed && hasUnpaidAmount) {
                return (
                  <button
                    onClick={() => handlePaymentClick(order)}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    title={t("manageOrders.actions.processPayment")}
                  >
                    <Euro className="w-5 h-5" />
                  </button>
                );
              }
              return null;
            })()}

            {/* Cancel Order Button - Only show if user has permission and order is not already cancelled/delivered */}
            {hasCancelOrderPermission() &&
              order.status !== "cancelled" &&
              order.status !== "delivered" && (
                <button
                  onClick={() => handleCancelOrderClick(order)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                  title={
                    t("manageOrders.actions.cancelOrder") || "Cancel Order"
                  }
                >
                  <CrossIcon className="w-5 h-5" />
                </button>
              )}
          </div>
        </td>
      </tr>
    );
  };
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
    <div className="p-4 flex flex-col">
      {/* Header */}
      <Header
        title={t("manageOrders.title")}
        subtitle={t("manageOrders.subtitle")}
        icon={<DocumentIcon className="w-8 h-8" />}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-6">
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
                  {/* <SearchIcon className="size-4" /> */}
                  <span>{t("manageOrders.searchOrders")}</span>
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
                    placeholder={t("manageOrders.searchPlaceholder")}
                    otherClasses="w-full"
                    inputClasses="pl-10 py-2.5"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("manageOrders.filterByDate")}
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

              {/* Customer Filter */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {/* <PersonIcon className="inline w-4 h-4 mr-1" /> */}
                  {t("manageOrders.customer")}
                </label>
                <CustomSelect
                  options={[
                    {
                      value: "",
                      label: t("manageOrders.allCustomers"),
                    },
                    ...customers.map((customer) => ({
                      value: customer.id || "",
                      label: `${customer.name} (${customer.phone})`,
                    })),
                  ]}
                  value={filter.selectedCustomer}
                  onChange={(value) => {
                    setFilter((prev) => ({
                      ...prev,
                      selectedCustomer: value,
                      page: 0,
                    }));
                  }}
                  placeholder={
                    loadingCustomers
                      ? "Loading..."
                      : t("manageOrders.allCustomers")
                  }
                  className="w-full"
                  disabled={loadingCustomers}
                />
              </div>

              {/* Delivery Person Filter */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {/* <PersonIcon className="inline w-4 h-4 mr-1" /> */}
                  {t("manageOrders.deliveryPerson")}
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: t("manageOrders.allDeliveryPersons") },
                    ...deliveryPersons.map((person) => ({
                      value: person.id,
                      label: person.name,
                    })),
                  ]}
                  value={filter.selectedDeliveryPerson}
                  onChange={(value) => {
                    setFilter((prev) => ({
                      ...prev,
                      selectedDeliveryPerson: value,
                      page: 0,
                    }));
                  }}
                  placeholder={
                    loadingDeliveryPersons
                      ? "Loading..."
                      : t("manageOrders.allDeliveryPersons")
                  }
                  className="w-full"
                  disabled={loadingDeliveryPersons}
                />
              </div>

              {/* Payment Status Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("manageOrders.paymentStatus")}
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: t("manageOrders.allPaymentStatuses") },
                    ...paymentStatuses.map((status) => ({
                      value: status,
                      label: translatePaymentStatus(status),
                    })),
                  ]}
                  value={filter.selectedPaymentStatus[0] || ""}
                  onChange={(value) =>
                    setFilter((prev) => ({
                      ...prev,
                      selectedPaymentStatus: value ? [value] : [],
                      page: 0,
                    }))
                  }
                  placeholder={t("manageOrders.allPaymentStatuses")}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                <button
                  onClick={clearFilters}
                  className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("manageOrders.clearAllFilters")}
                </button>
                <button
                  onClick={handleBulkPaymentClick}
                  className="w-full sm:w-auto bg-gradient-to-r from-black to-gray-800 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <LightningBoltIcon className="w-4 h-4" />
                  <span>{t("manageOrders.bulkPayment")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {t("manageOrders.showingOrders", {
              filtered: orders.length,
              total: totalOrders || 0,
            })}
          </p>
          <div className="text-sm text-gray-500">
            {t("manageOrders.lastUpdated", {
              time: new Date().toLocaleString(),
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <OrderTable
            data={orders}
            columns={columns}
            renderRow={renderOrderRow}
            emptyStateIcon={
              <DeliveredIcon className="mx-auto size-12 text-gray-400" />
            }
            emptyStateTitle={
              filter.searchTerm ||
              filter.selectedDate ||
              filter.selectedDeliveryPerson ||
              filter.selectedCustomer ||
              filter.selectedStatus.length > 0
                ? t("manageOrders.noOrdersMatch")
                : t("manageOrders.noOrdersFound")
            }
          />
          <Pagination
            currentPage={filter.page || 0}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Individual Payment Modal */}
      <IndividualPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        order={selectedOrderForPayment}
        token={token || ""}
        refreshOrdersCallback={refreshOrdersCallback}
      />

      {/* Bulk Payment Modal */}
      <BulkPaymentModal
        isOpen={isBulkPaymentModalOpen}
        onClose={() => setIsBulkPaymentModalOpen(false)}
        orders={orders}
        deliveryPersons={deliveryPersons}
        token={token || ""}
        refreshOrdersCallback={refreshOrdersCallback}
      />

      {/* Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
          view="manage"
          platforms={platforms}
        />
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onClose={() => {
          setIsCancelOrderModalOpen(false);
          setSelectedOrderForCancel(null);
        }}
        onConfirm={handleCancelOrderConfirm}
        order={selectedOrderForCancel}
        orderPrefix={configurations.orderPrefix || "K"}
      />
    </div>
  );
};
