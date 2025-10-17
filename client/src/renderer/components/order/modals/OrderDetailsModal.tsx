import React from "react";
import { Order } from "@/types/order";
import { StringToComplements } from "../../../utils/order";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "../../../utils/paymentStatus";
import { formatAddress } from "../../../utils/utils";
import { useTranslation } from "react-i18next";

const parseComplements = (complements: any) => {
  if (Array.isArray(complements)) return complements;

  if (typeof complements === "string") {
    return StringToComplements(complements);
  }

  return [];
};

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  view?: "kitchen" | "manage";
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  view = "kitchen",
}) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">
                {t("orderDetailsModal.title", { orderId: order.orderId })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("orderDetailsModal.created", {
                  date: new Date(order.createdAt || "").toLocaleString(),
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {view === "manage" ? (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.customerInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.name")}
                    </p>
                    <p className="text-black">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.phone")}
                    </p>
                    <p className="text-black">{order.customer.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.address")}
                    </p>
                    <p className="text-black">
                      {formatAddress(order.customer.address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.orderInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.orderType")}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.orderType?.toUpperCase() ||
                        t("manageOrders.statuses.nA")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.status")}
                    </p>
                    <p className="text-black">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.created")}
                    </p>
                    <p className="text-black">
                      {new Date(order.createdAt || "").toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.updated")}
                    </p>
                    <p className="text-black">
                      {order.updatedAt
                        ? new Date(order.updatedAt).toLocaleString()
                        : t("manageOrders.statuses.nA")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.paymentInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.paymentStatus")}
                    </p>
                    {(() => {
                      const { orderTotal } = calculateOrderTotal(
                        order.items || []
                      );
                      const paymentStatus = calculatePaymentStatus(
                        order.paymentType || "",
                        orderTotal
                      );
                      return (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusStyle(paymentStatus.status)}`}
                          >
                            {paymentStatus.status}
                          </span>
                          {paymentStatus.status === "PARTIAL" && (
                            <span className="text-xs text-yellow-700">
                              €{paymentStatus.totalPaid.toFixed(2)} / €
                              {orderTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.totalAmount")}
                    </p>
                    <p className="text-black font-semibold">
                      €
                      {calculateOrderTotal(
                        order.items || []
                      ).orderTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {order.deliveryPerson && (
                <div>
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                    {t("orderDetailsModal.deliveryInformation")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.deliveryPerson")}
                      </p>
                      <p className="text-black">{order.deliveryPerson.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.phone")}
                      </p>
                      <p className="text-black">{order.deliveryPerson.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.vehicleType")}
                      </p>
                      <p className="text-black">
                        {order.deliveryPerson.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.assignedAt")}
                      </p>
                      <p className="text-black">
                        {order.assignedAt
                          ? new Date(order.assignedAt).toLocaleString()
                          : order.status === "out for delivery" ||
                              order.status === "delivered"
                            ? t("orderDetailsModal.notRecorded")
                            : t("orderDetailsModal.notAssignedYet")}
                      </p>
                    </div>
                    {order.deliveredAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {t("orderDetailsModal.deliveredAt")}
                        </p>
                        <p className="text-black">
                          {new Date(order.deliveredAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.orderItems")}
                </h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => {
                    const parsedComplements = parseComplements(
                      item.complements
                    );
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-black text-lg">
                              {item.quantity}x {item.productName}
                              {item.variantName && (
                                <span className="text-gray-600 font-normal">
                                  {" "}
                                  ({item.variantName})
                                </span>
                              )}
                            </h4>
                            {parsedComplements.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  {t("orderDetailsModal.addOns")}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {parsedComplements.map(
                                    (complement, compIndex) => (
                                      <span
                                        key={compIndex}
                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                      >
                                        {complement.itemName}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-black">
                              €{item.totalPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              €{(item.totalPrice / item.quantity).toFixed(2)}{" "}
                              {t("orderDetailsModal.each")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }) || (
                    <p className="text-gray-500 text-center py-4">
                      {t("orderDetailsModal.noItemsFound")}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                    {t("orderDetailsModal.orderNotes")}
                  </h3>
                  <p className="text-black bg-gray-50 p-3 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Kitchen view - simplified
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => {
                  const parsedComplements = parseComplements(item.complements);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-black text-lg">
                          {item.quantity}x {item.productName}
                          {item.variantName && (
                            <span className="text-gray-600 font-normal">
                              {" "}
                              ({item.variantName})
                            </span>
                          )}
                        </h4>
                        {parsedComplements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Add-ons:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {parsedComplements.map(
                                (complement, compIndex) => (
                                  <span
                                    key={compIndex}
                                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                  >
                                    {complement.itemName}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) || (
                  <p className="text-gray-500 text-center py-4">
                    No items found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
