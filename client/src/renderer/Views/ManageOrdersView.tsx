import { useState, useMemo, useEffect } from "react";
import { Order } from "@/types/order";
import { DeliveryPerson } from "@/types/delivery";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import { calculateOrderTotal } from "../utils/orderCalculations";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "../utils/paymentStatus";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import OrderDetailsModal from "../components/order/modals/OrderDetailsModal";
import BulkPaymentModal from "../components/order/modals/BulkPaymentModal";
import IndividualPaymentModal from "../components/order/modals/IndividualPaymentModal";
import { toast } from "react-toastify";

// ICONS
import SearchIcon from "../assets/icons/search.svg?react";
import PersonIcon from "../assets/icons/person.svg?react";
import EyeIcon from "../assets/icons/eye.svg?react";
import DocumentIcon from "../assets/icons/document.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";
import DeliveredIcon from "../assets/icons/delivered.svg?react";
import { Euro } from "@/renderer/assets/Svg";
import { useOrderManagementContext } from "../contexts/orderManagementContext";
import { useConfigurations } from "../contexts/configurationContext";

export const ManageOrdersView = () => {
  const { t } = useTranslation();
  const {
    auth: { token },
  } = useAuth();
  const { orders, filter, setFilter, refreshOrdersCallback } =
    useOrderManagementContext();
  const { configurations } = useConfigurations();
  useEffect(() => {
    if (!filter.selectedDate) {
      setFilter((prev) => ({
        ...prev,
        selectedDate: new Date(),
      }));
    }
  }, [filter.selectedDate, setFilter]);

  // Fetch delivery persons on component mount
  useEffect(() => {
    fetchDeliveryPersons();
  }, []);
  useEffect(() => {
    setFilter({
      searchTerm: "",
      selectedDate: null,
      selectedStatus: [],
      selectedPaymentStatus: [],
      page: 0,
      limit: 0,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
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

  // Fetch delivery persons from database
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

  const paymentStatuses = ["PARTIAL", "UNPAID", "PAID"];

  const clearFilters = () => {
    setFilter({
      searchTerm: "",
      selectedDate: new Date(),
      selectedStatus: ["all"],
      selectedPaymentStatus: [],
      page: 0,
      limit: 0,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
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

  const handlePrintOrder = (order: Order) => {
    // TODO: Implement print order functionality
    console.log("Print order:", order.id);
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
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          {configurations.orderPrefix || "K"}
          {order.orderId}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {order.customer.name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {order.orderType?.toUpperCase() || t("manageOrders.statuses.nA")}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusStyle(paymentStatus.status)}`}
            >
              {paymentStatus.status}
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
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title={t("manageOrders.actions.viewOrder")}
            >
              <EyeIcon className="w-4 h-4" />
            </button>

            {/* Print Order Button */}
            <button
              onClick={() => handlePrintOrder(order)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title={t("manageOrders.actions.printOrder")}
            >
              <DocumentIcon className="w-4 h-4" />
            </button>

            {/* Process Payment Button - Only show for UNPAID or PARTIAL orders */}
            {(() => {
              const { orderTotal } = calculateOrderTotal(order.items || []);
              const paymentStatus = calculatePaymentStatus(
                order.paymentType || "",
                orderTotal
              );

              const isPaymentAllowed =
                order.status === "complete" || order.status === "delivered";
              const hasUnpaidAmount =
                paymentStatus.status === "UNPAID" ||
                paymentStatus.status === "PARTIAL";

              if (isPaymentAllowed && hasUnpaidAmount) {
                return (
                  <button
                    onClick={() => handlePaymentClick(order)}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                    title={t("manageOrders.actions.processPayment")}
                  >
                    <Euro className="w-4 h-4" />
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </td>
      </tr>
    );
  };
  console.log(orders);
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search Input */}
            <div className="w-full lg:w-80">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline w-4 h-4 mr-1">🔍</span>
                {t("manageOrders.searchOrders")}
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
                    }))
                  }
                  placeholder={t("manageOrders.searchPlaceholder")}
                  otherClasses="w-full"
                  inputClasses="pl-10 py-2.5"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline w-4 h-4 mr-1">📅</span>
                {t("manageOrders.filterByDate")}
              </label>
              <input
                type="date"
                value={
                  filter.selectedDate
                    ? filter.selectedDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    selectedDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              />
            </div>

            {/* Delivery Person Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PersonIcon className="inline w-4 h-4 mr-1" />
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
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                  })),
                ]}
                value={filter.selectedPaymentStatus[0] || ""}
                onChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    selectedPaymentStatus: value ? [value] : [],
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
                className="w-full sm:w-auto px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("manageOrders.clearAllFilters")}
              </button>
              <button
                onClick={handleBulkPaymentClick}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <ThunderIcon className="w-4 h-4" />
                <span>{t("manageOrders.bulkPayment")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {t("manageOrders.showingOrders", {
              filtered: orders.length,
              total: orders.length,
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
              filter.selectedStatus.length > 0
                ? t("manageOrders.noOrdersMatch")
                : t("manageOrders.noOrdersFound")
            }
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
        />
      )}
    </div>
  );
};
