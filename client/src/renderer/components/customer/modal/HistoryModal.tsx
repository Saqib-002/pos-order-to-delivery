import { useState, useEffect } from "react";
import { Customer, Order } from "@/types/order";
import { useAuth } from "../../../contexts/AuthContext";
import { CrossIcon } from "../../../public/Svg";
import CustomButton from "../../ui/CustomButton";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { useTranslation } from "react-i18next";
import Pagination from "../../shared/Pagination";

interface HistoryModalProps {
  customer: Customer;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

const HistoryModal = ({ customer, onClose }: HistoryModalProps) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
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
              {t("customerManagement.historyModal.noOrders", "No orders found for this customer.")}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                       const { orderTotal } = calculateOrderTotal(order.items || []);
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' : 
                                order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {orderTotal.toFixed(2)}
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