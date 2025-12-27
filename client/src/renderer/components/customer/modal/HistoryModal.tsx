import { useState, useEffect } from "react";
import { Customer, Order } from "@/types/order";
import { useAuth } from "../../../contexts/AuthContext";
import { CrossIcon, PrinterIcon } from "../../../public/Svg";
import CustomButton from "../../ui/CustomButton";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { useTranslation } from "react-i18next";
import Pagination from "../../shared/Pagination";
import {
  generateReceiptHTML,
  groupItemsByPrinter,
} from "../../../utils/printer";
import { calculatePaymentStatus } from "../../../utils/paymentStatus";
import { formatAddress } from "../../../utils/utils";
import { useConfigurations } from "../../../contexts/configurationContext";
import { toast } from "react-toastify";
import { StringToComplements } from "../../../utils/order";

interface HistoryModalProps {
  customer: Customer;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

const HistoryModal = ({ customer, onClose }: HistoryModalProps) => {
  const { t } = useTranslation();
  const {
    auth: { token, user },
  } = useAuth();
  const { configurations } = useConfigurations();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!customer.id) return;
      try {
        setLoading(true);
        const filter = {
          selectedCustomer: customer.id,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          selectedStatus: [],
          selectedPaymentStatus: [],
          searchTerm: "",
          selectedDate: null,
          startDateRange: null,
          endDateRange: null,
          selectedDeliveryPerson: "",
        };

        const res = await (window as any).electronAPI.getOrdersByFilter(
          token,
          filter
        );

        if (res.status && res.data?.orders) {
          setOrders(res.data.orders);
          setTotalCount(res.data.totalCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch customer history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customer.id, token, currentPage]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePrintOrder = async (order: Order) => {
    try {
      // Fetch order items if not already loaded
      let orderItems = order.items || [];
      if (!orderItems || orderItems.length === 0) {
        const itemsRes = await (window as any).electronAPI.getOrderItems(
          token,
          order.orderId
        );
        if (itemsRes.status && itemsRes.data) {
          orderItems = itemsRes.data;
        } else {
          toast.error(t("orderCart.errors.errorGettingOrderItems"));
          return;
        }
      }

      // Convert complements from string to array format
      const convertedItems = orderItems.map((item: any) => ({
        ...item,
        complements: StringToComplements(item.complements),
      }));

      const printerGroups = groupItemsByPrinter(convertedItems);
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
        vatNumber: configurations.vatNumber || "",
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

      const { orderTotal } = calculateOrderTotal(convertedItems);
      const { status } = calculatePaymentStatus(
        order.paymentType || "",
        orderTotal
      );

      toast.info(t("orderCart.messages.printingCustomerReceipt"));

      for (const [printer, items] of Object.entries(printerGroups)) {
        const printerName = printer.split("|")[0];
        const printerIsMain = printer.split("|")[1];

        if (printerIsMain === "true") {
          let customerAddress: string | undefined = undefined;
          if (order.orderType === "delivery") {
            if (order?.customer?.address && order.customer.address.trim()) {
              customerAddress = order.customer.address.includes("|")
                ? formatAddress(order.customer.address)
                : order.customer.address;
            }
          }

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
      console.error("Failed to print receipt:", error);
      toast.error(t("orderCart.errors.errorPrintingReceipt"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">
                {t("customerManagement.historyModal.title", "Order History")}
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                {customer.name} - {customer.phone}
              </p>
            </div>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t(
                "customerManagement.historyModal.noOrders",
                "No orders found for this customer."
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.orderId", "Order #")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.date", "Date")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.type", "Type")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.status", "Status")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.total", "Total")}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("common.actions", "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const displayItems = (order.items || []).map(
                        (item: any) => ({
                          ...item,
                          complements: Array.isArray(item.complements)
                            ? item.complements
                            : StringToComplements(item.complements),
                        })
                      );
                      const { orderTotal } = calculateOrderTotal(displayItems);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {order.orderType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                order.status?.toLowerCase() === "completed" ||
                                order.status?.toLowerCase() === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status?.toLowerCase() === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            €{orderTotal.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handlePrintOrder(order)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 cursor-pointer"
                              title={t(
                                "manageOrders.actions.printOrder",
                                "Print Receipt"
                              )}
                            >
                              <PrinterIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                containerClasses="mt-4 border-t border-gray-200 pt-4"
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={onClose}
            label={t("common.close", "Close")}
          />
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
